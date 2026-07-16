const cron = require("node-cron");
const { sequelize } = require("../config/database");
const notificationService = require("../api/services/notification.service");

const REMINDER_DAYS_BEFORE_STAGE = 3;

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
    ORDER BY ten_chinh_sach ASC, tu_ngay ASC
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
      hs.id_khu_vuc,
      hs.dinh_muc_cong_no,
      hs.trang_thai_ho_so,
      hs.duoc_phep_tra_sau,
      hs.bi_khoa_tra_sau,
      nd.ho_ten,
      cs.ten_chinh_sach AS ten_chinh_sach_hien_tai,
      cs.tu_ngay AS tu_ngay_hien_tai,
      vn.ngay_tha_giong,
      vn.ten_vu_nuoi
    FROM ho_so_khach_hang hs
    INNER JOIN nguoi_dung nd ON nd.id_nguoi_dung = hs.id_nguoi_dung
    INNER JOIN vu_nuoi vn ON vn.id_vu_nuoi = hs.id_vu_nuoi
    INNER JOIN chinh_sach_han_muc cs ON cs.id_chinh_sach = hs.id_chinh_sach
    WHERE hs.duoc_phep_tra_sau = 1
      AND hs.trang_thai_ho_so = 'da_duyet'
      AND hs.bi_khoa_tra_sau = 0
      AND vn.ngay_tha_giong IS NOT NULL
  `);

  return profiles;
};

const findUpcomingPolicyInSameSet = (policies, profile, farmingDays) => {
  if (!profile.ten_chinh_sach_hien_tai) return null;

  return (
    policies
      .filter((policy) => {
        const daysUntilStart = Number(policy.tu_ngay) - farmingDays;

        return (
          policy.ten_chinh_sach === profile.ten_chinh_sach_hien_tai &&
          Number(policy.tu_ngay) > Number(profile.tu_ngay_hien_tai || 0) &&
          daysUntilStart >= 0 &&
          daysUntilStart <= REMINDER_DAYS_BEFORE_STAGE
        );
      })
      .sort((a, b) => Number(a.tu_ngay) - Number(b.tu_ngay))[0] || null
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
      console.log("[LIMIT POLICY REMINDER] Khong co chinh sach hoat dong");
      return;
    }

    const profiles = await getApprovedProfiles();

    if (!profiles.length) {
      console.log("[LIMIT POLICY REMINDER] Khong co ho so can kiem tra");
      return;
    }

    const today = new Date();
    let createdCount = 0;

    for (const profile of profiles) {
      const farmingDays = getDayDiff(profile.ngay_tha_giong, today);

      if (farmingDays === null) continue;

      const targetPolicy = findUpcomingPolicyInSameSet(
        policies,
        profile,
        farmingDays
      );

      if (!targetPolicy) continue;

      const currentPolicyId = Number(profile.id_chinh_sach || 0);
      const notifiedPolicyId = Number(profile.id_chinh_sach_da_nhac || 0);
      const targetPolicyId = Number(targetPolicy.id_chinh_sach);

      if (targetPolicyId === currentPolicyId) continue;
      if (targetPolicyId === notifiedPolicyId) continue;

      const daysUntilStart = Math.max(
        Number(targetPolicy.tu_ngay) - farmingDays,
        0
      );

      const notifications = await notificationService.notifyLimitStaffByArea({
        id_khu_vuc: profile.id_khu_vuc,
        tieu_de: "Sap den moc nang han muc",
        noi_dung: `Ho so #${profile.id_ho_so} cua khach hang ${profile.ho_ten} dang o ${farmingDays} ngay nuoi, con ${daysUntilStart} ngay den ${targetPolicy.ten_chinh_sach} - ${targetPolicy.giai_doan}. Vui long khao sat va lap phieu de xuat nang han muc.`,
        loai: "cong_no",
        lien_ket: `/nhan-vien-dinh-muc/tao-phieu-de-xuat`,
      });

      const notifiedCount = notifications.length;

      if (notifiedCount > 0) {
        createdCount += notifiedCount;
        await updateNotifiedPolicy(profile.id_ho_so, targetPolicyId);
      }
    }

    console.log(
      `[LIMIT POLICY REMINDER] Da tao ${createdCount} thong bao kiem dinh han muc`
    );
  } catch (error) {
    console.error("[LIMIT POLICY REMINDER ERROR]", error.message);
  }
};

const startLimitPolicyReminderJob = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      await runLimitPolicyReminder();
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  console.log("[LIMIT POLICY REMINDER] Job da bat - chay moi 1 phut");
};

module.exports = {
  runLimitPolicyReminder,
  startLimitPolicyReminderJob,
};
