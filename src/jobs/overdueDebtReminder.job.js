const cron = require("node-cron");
const { sequelize } = require("../config/database");
const sendEmail = require("../helpers/sendEmail");

const DEFAULT_POSTPAID_OVERDUE_INTEREST_RATE_MONTHLY = 1.2;

const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDate = (value) => {
  if (!value) return "chưa có";
  return new Date(value).toLocaleDateString("vi-VN");
};

// Gửi email an toàn để job không bị dừng nếu một email bị lỗi.
const safeSendEmail = async (to, subject, text) => {
  if (!to) return false;

  try {
    await sendEmail(to, subject, text);
    return true;
  } catch (error) {
    console.error("[OVERDUE DEBT EMAIL ERROR]", to, error.message);
    return false;
  }
};

// Lấy các hồ sơ có đơn trả sau đã hoàn tất, quá hạn thanh toán và còn nợ gốc.
const getOverdueDebtProfiles = async () => {
  const [profiles] = await sequelize.query(
    `
      SELECT
        hs.id_ho_so,
        hs.id_nguoi_dung,
        hs.id_ao,
        hs.id_vu_nuoi,
        hs.han_thanh_toan,
        nd.ho_ten,
        nd.email,
        a.ten_ao,
        vn.ten_vu_nuoi,
        DATEDIFF(CURDATE(), DATE(hs.han_thanh_toan)) AS so_ngay_qua_han,
        SUM(GREATEST(dh.tong_thanh_toan - IFNULL(paid.da_thanh_toan, 0), 0)) AS cong_no_goc,
        SUM(
          ROUND(
            GREATEST(dh.tong_thanh_toan - IFNULL(paid.da_thanh_toan, 0), 0)
            * (
              CASE
                WHEN dh.lai_suat_qua_han_thang IS NULL OR dh.lai_suat_qua_han_thang <= 0
                  THEN :defaultMonthlyRate
                ELSE dh.lai_suat_qua_han_thang
              END / 100
            )
            * CEIL(DATEDIFF(CURDATE(), DATE(hs.han_thanh_toan)) / 30)
          )
        ) AS tien_lai_qua_han
      FROM ho_so_khach_hang hs
      INNER JOIN nguoi_dung nd ON nd.id_nguoi_dung = hs.id_nguoi_dung
      LEFT JOIN ao_nuoi a ON a.id_ao = hs.id_ao
      LEFT JOIN vu_nuoi vn ON vn.id_vu_nuoi = hs.id_vu_nuoi
      INNER JOIN don_hang dh ON dh.id_ho_so = hs.id_ho_so
      LEFT JOIN (
        SELECT
          ctt.id_don_hang,
          SUM(ctt.so_tien_phan_bo) AS da_thanh_toan
        FROM chi_tiet_thanh_toan_cong_no ctt
        INNER JOIN thanh_toan_cong_no tt
          ON tt.id_thanh_toan_cong_no = ctt.id_thanh_toan_cong_no
        WHERE tt.trang_thai = 'thanh_cong'
        GROUP BY ctt.id_don_hang
      ) paid ON paid.id_don_hang = dh.id_don_hang
      WHERE hs.duoc_phep_tra_sau = 1
        AND hs.trang_thai_ho_so = 'da_duyet'
        AND hs.han_thanh_toan IS NOT NULL
        AND DATE(hs.han_thanh_toan) < CURDATE()
        AND (hs.ngay_nhac_no_qua_han IS NULL OR hs.ngay_nhac_no_qua_han < CURDATE())
        AND dh.hinh_thuc_thanh_toan = 'tra_sau'
        AND dh.trang_thai_don_hang = 'hoan_tat'
      GROUP BY
        hs.id_ho_so,
        hs.id_nguoi_dung,
        hs.id_ao,
        hs.id_vu_nuoi,
        hs.han_thanh_toan,
        nd.ho_ten,
        nd.email,
        a.ten_ao,
        vn.ten_vu_nuoi
      HAVING cong_no_goc > 0
      ORDER BY hs.han_thanh_toan ASC
    `,
    {
      replacements: {
        defaultMonthlyRate: DEFAULT_POSTPAID_OVERDUE_INTEREST_RATE_MONTHLY,
      },
    }
  );

  return profiles;
};

const getAdminEmails = async () => {
  const [admins] = await sequelize.query(`
    SELECT email, ho_ten
    FROM nguoi_dung
    WHERE vai_tro = 'admin'
      AND trang_thai_tai_khoan = 'hoat_dong'
      AND email IS NOT NULL
      AND email <> ''
  `);

  return admins;
};

const markProfileReminded = async (profileId) => {
  await sequelize.query(
    `
      UPDATE ho_so_khach_hang
      SET ngay_nhac_no_qua_han = CURDATE()
      WHERE id_ho_so = :profileId
    `,
    {
      replacements: { profileId },
    }
  );
};

const buildCustomerEmail = (profile) => {
  const principal = Number(profile.cong_no_goc || 0);
  const interest = Number(profile.tien_lai_qua_han || 0);
  const total = principal + interest;

  return {
    subject: `Nhắc thanh toán công nợ quá hạn - Hồ sơ #${profile.id_ho_so}`,
    text: [
      `Xin chào ${profile.ho_ten || "Quý khách"},`,
      "",
      `Hồ sơ mua trả sau #${profile.id_ho_so} của bạn đã quá hạn thanh toán.`,
      `Ao/Vụ nuôi: ${profile.ten_ao || `Ao #${profile.id_ao}`} - ${
        profile.ten_vu_nuoi || `Vụ #${profile.id_vu_nuoi}`
      }`,
      `Hạn thanh toán: ${formatDate(profile.han_thanh_toan)}`,
      `Số ngày quá hạn: ${Number(profile.so_ngay_qua_han || 0)} ngày`,
      `Nợ gốc còn lại: ${formatMoney(principal)}`,
      `Lãi quá hạn tạm tính: ${formatMoney(interest)}`,
      `Tổng cần thanh toán: ${formatMoney(total)}`,
      "",
      "Vui lòng đăng nhập hệ thống Nhà Nông để thanh toán công nợ hoặc liên hệ Admin nếu cần hỗ trợ gia hạn.",
      "",
      "Trân trọng,",
      "Hệ thống Nhà Nông",
    ].join("\n"),
  };
};

const buildAdminSummaryEmail = (profiles) => {
  const totalPrincipal = profiles.reduce(
    (sum, item) => sum + Number(item.cong_no_goc || 0),
    0
  );
  const totalInterest = profiles.reduce(
    (sum, item) => sum + Number(item.tien_lai_qua_han || 0),
    0
  );

  const lines = profiles.map((item) => {
    const principal = Number(item.cong_no_goc || 0);
    const interest = Number(item.tien_lai_qua_han || 0);

    return [
      `- Hồ sơ #${item.id_ho_so} | ${item.ho_ten || "Khách hàng"} | ${
        item.email || "không có email"
      }`,
      `  Trạng thái email khách: ${
        item.email_sent ? "đã gửi" : "chưa gửi/gửi lỗi"
      }`,
      `  Ao/Vụ: ${item.ten_ao || `Ao #${item.id_ao}`} - ${
        item.ten_vu_nuoi || `Vụ #${item.id_vu_nuoi}`
      }`,
      `  Quá hạn: ${Number(item.so_ngay_qua_han || 0)} ngày | Nợ gốc: ${formatMoney(
        principal
      )} | Lãi: ${formatMoney(interest)} | Tổng: ${formatMoney(
        principal + interest
      )}`,
    ].join("\n");
  });

  return {
    subject: `Báo cáo công nợ quá hạn - ${profiles.length} hồ sơ cần xử lý`,
    text: [
      "Admin thân mến,",
      "",
      `Hệ thống ghi nhận ${profiles.length} hồ sơ công nợ quá hạn cần theo dõi hôm nay.`,
      `Tổng nợ gốc: ${formatMoney(totalPrincipal)}`,
      `Tổng lãi quá hạn tạm tính: ${formatMoney(totalInterest)}`,
      `Tổng cần theo dõi: ${formatMoney(totalPrincipal + totalInterest)}`,
      "",
      "Chi tiết:",
      ...lines,
      "",
      "Vui lòng truy cập trang quản trị công nợ để theo dõi và xử lý.",
    ].join("\n"),
  };
};

const runOverdueDebtReminder = async () => {
  try {
    const profiles = await getOverdueDebtProfiles();

    if (!profiles.length) {
      console.log("[OVERDUE DEBT REMINDER] Khong co ho so qua han can nhac");
      return;
    }

    const reportProfiles = [];
    let sentCustomerCount = 0;

    for (const profile of profiles) {
      const email = buildCustomerEmail(profile);
      const sent = await safeSendEmail(profile.email, email.subject, email.text);

      reportProfiles.push({
        ...profile,
        email_sent: sent,
      });

      if (!sent) continue;

      sentCustomerCount += 1;
      await markProfileReminded(profile.id_ho_so);
    }

    const adminEmail = buildAdminSummaryEmail(reportProfiles);
    const admins = await getAdminEmails();

    for (const admin of admins) {
      await safeSendEmail(admin.email, adminEmail.subject, adminEmail.text);
    }

    console.log(
      `[OVERDUE DEBT REMINDER] Da nhac ${sentCustomerCount} khach hang qua han va bao ${admins.length} admin`
    );
  } catch (error) {
    console.error("[OVERDUE DEBT REMINDER ERROR]", error.message);
  }
};

const startOverdueDebtReminderJob = () => {
  const schedule = process.env.OVERDUE_DEBT_REMINDER_CRON || "30 7 * * *";

  cron.schedule(
    schedule,
    async () => {
      await runOverdueDebtReminder();
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  console.log(`[OVERDUE DEBT REMINDER] Job da bat - lich: ${schedule}`);
};

module.exports = {
  runOverdueDebtReminder,
  startOverdueDebtReminderJob,
};
