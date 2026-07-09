const cron = require("node-cron");
const { sequelize } = require("../config/database");
const notificationService = require("../api/services/notification.service");

const getDayDiff = (fromDate, toDate) => {
  if (!fromDate || !toDate) return null;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return Math.max(
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    0
  );
};

const getPolicies = async () => {
  const [policies] = await sequelize.query(`
    SELECT 
      id_chinh_sach,
      ten_chinh_sach,
      giai_doan,
      tu_ngay,
      den_ngay,
      han_muc_toi_da
    FROM chinh_sach_han_muc
    WHERE trang_thai = 'hoat_dong'
    ORDER BY tu_ngay ASC
  `);

  return policies;
};

const getApprovedProfiles = async () => {
  const [profiles] = await sequelize.query(`
    SELECT 
      hs.id_ho_so,
      hs.id_nguoi_dung,
      hs.id_chinh_sach,
      hs.id_chinh_sach_da_nhac,
      hs.dinh_muc_cong_no,
      hs.trang_thai_ho_so,
      hs.duoc_phep_tra_sau,
      hs.bi_khoa_tra_sau,
      nd.ho_ten,
      vn.ngay_tha_giong,
      vn.ten_vu_nuoi
    FROM ho_so_khach_hang hs
    INNER JOIN nguoi_dung nd ON nd.id_nguoi_dung = hs.id_nguoi_dung
    INNER JOIN vu_nuoi vn ON vn.id_vu_nuoi = hs.id_vu_nuoi
    WHERE hs.duoc_phep_tra_sau = 1
      AND hs.trang_thai_ho_so = 'da_duyet'
      AND hs.bi_khoa_tra_sau = 0
      AND vn.ngay_tha_giong IS NOT NULL
  `);

  return profiles;
};

const getLimitStaffUsers = async () => {
  const [staffs] = await sequelize.query(`
    SELECT id_nguoi_dung, ho_ten
    FROM nguoi_dung
    WHERE vai_tro = 'nhan_vien_dinh_muc'
      AND trang_thai_tai_khoan = 'hoat_dong'
  `);

  return staffs;
};

const findTargetPolicyByFarmingDay = (policies, farmingDays) => {
  return (
    policies
      .filter((policy) => farmingDays >= Number(policy.tu_ngay))
      .sort((a, b) => Number(b.tu_ngay) - Number(a.tu_ngay))[0] || null
  );
};

const updateNotifiedPolicy = async (id_ho_so, id_chinh_sach) => {
  await sequelize.query(
    `
      UPDATE ho_so_khach_hang
      SET id_chinh_sach_da_nhac = :id_chinh_sach
      WHERE id_ho_so = :id_ho_so
    `,
    {
      replacements: {
        id_ho_so,
        id_chinh_sach,
      },
    }
  );
};

const runLimitPolicyReminder = async () => {
  try {
    const policies = await getPolicies();

    if (!policies.length) {
      console.log("[LIMIT POLICY REMINDER] Không có chính sách hạn mức hoạt động");
      return;
    }

    const profiles = await getApprovedProfiles();

    if (!profiles.length) {
      console.log("[LIMIT POLICY REMINDER] Không có hồ sơ cần kiểm tra");
      return;
    }

    const staffs = await getLimitStaffUsers();

    if (!staffs.length) {
      console.log("[LIMIT POLICY REMINDER] Không có nhân viên định mức hoạt động");
      return;
    }

    const today = new Date();
    let createdCount = 0;

    for (const profile of profiles) {
      const farmingDays = getDayDiff(profile.ngay_tha_giong, today);

      if (farmingDays === null) continue;

      const targetPolicy = findTargetPolicyByFarmingDay(policies, farmingDays);

      if (!targetPolicy) continue;

      const currentPolicyId = Number(profile.id_chinh_sach || 0);
      const notifiedPolicyId = Number(profile.id_chinh_sach_da_nhac || 0);
      const targetPolicyId = Number(targetPolicy.id_chinh_sach);

      if (targetPolicyId === currentPolicyId) continue;
      if (targetPolicyId === notifiedPolicyId) continue;

      for (const staff of staffs) {
        await notificationService.createNotification({
          id_nguoi_dung: staff.id_nguoi_dung,
          tieu_de: "Đến hạn kiểm định nâng hạn mức",
          noi_dung: `Hồ sơ #${profile.id_ho_so} của khách hàng ${profile.ho_ten} đã đạt ${farmingDays} ngày nuôi, phù hợp chính sách ${targetPolicy.ten_chinh_sach}. Vui lòng khảo sát và lập phiếu đề xuất nâng hạn mức.`,
          loai: "cong_no",
          lien_ket: `/nhan-vien-dinh-muc/tao-phieu-de-xuat`,
        });

        createdCount += 1;
      }

      await updateNotifiedPolicy(profile.id_ho_so, targetPolicyId);
    }

    console.log(
      `[LIMIT POLICY REMINDER] Đã tạo ${createdCount} thông báo kiểm định hạn mức`
    );
  } catch (error) {
    console.error("[LIMIT POLICY REMINDER ERROR]", error.message);
  }
};

const startLimitPolicyReminderJob = () => {
  cron.schedule(
"0 7 * * *",
//"*/1 * * * *"
    async () => {
      await runLimitPolicyReminder();
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  console.log("[LIMIT POLICY REMINDER] Job đã được bật - chạy mỗi ngày 07:00");
};

module.exports = {
  runLimitPolicyReminder,
  startLimitPolicyReminderJob,
};