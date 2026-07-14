const notificationRepository = require("../repositories/notification.repository");
const limitStaffAreaRepository = require("../repositories/limitStaffArea.repository");

const createNotification = async ({
  id_nguoi_dung,
  tieu_de,
  noi_dung,
  loai = "he_thong",
  lien_ket = null,
  transaction = null,
}) => {
  if (!id_nguoi_dung || !tieu_de || !noi_dung) return null;

  return await notificationRepository.create(
    {
      id_nguoi_dung,
      tieu_de,
      noi_dung,
      loai,
      lien_ket,
      da_doc: false,
      ngay_tao: new Date(),
    },
    transaction ? { transaction } : {}
  );
};

const createManyNotifications = async (notifications, transaction = null) => {
  const filtered = notifications.filter(
    (item) => item.id_nguoi_dung && item.tieu_de && item.noi_dung
  );

  return Promise.all(
    filtered.map((item) =>
      createNotification({
        ...item,
        transaction,
      })
    )
  );
};

const notifyRole = async ({
  vai_tro,
  tieu_de,
  noi_dung,
  loai = "he_thong",
  lien_ket = null,
  transaction = null,
}) => {
  const users = await notificationRepository.findUsersByRole(vai_tro);
  return createManyNotifications(
    users.map((user) => ({
      id_nguoi_dung: user.id_nguoi_dung,
      tieu_de,
      noi_dung,
      loai,
      lien_ket,
    })),
    transaction
  );
};

const notifyAdmins = async (data) => {
  return notifyRole({
    ...data,
    vai_tro: "admin",
  });
};

const notifyLimitStaffByArea = async ({
  id_khu_vuc,
  tieu_de,
  noi_dung,
  loai = "ho_so",
  lien_ket = null,
  transaction = null,
}) => {
  if (!id_khu_vuc) return [];

  const assignments = await limitStaffAreaRepository.findActiveStaffByArea(
    id_khu_vuc
  );

  return createManyNotifications(
    assignments.map((assignment) => ({
      id_nguoi_dung: assignment.id_nguoi_dung,
      tieu_de,
      noi_dung,
      loai,
      lien_ket,
    })),
    transaction
  );
};

const sendAdminNotification = async (user, data) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen gui thong bao");
  }

  if (!data.tieu_de || !data.noi_dung) {
    throw new Error("Tieu de va noi dung thong bao khong duoc de trong");
  }

  if (data.id_nguoi_dung) {
    return createNotification({
      id_nguoi_dung: data.id_nguoi_dung,
      tieu_de: data.tieu_de,
      noi_dung: data.noi_dung,
      loai: data.loai || "he_thong",
      lien_ket: data.lien_ket || null,
    });
  }

  if (data.vai_tro) {
    return notifyRole({
      vai_tro: data.vai_tro,
      tieu_de: data.tieu_de,
      noi_dung: data.noi_dung,
      loai: data.loai || "he_thong",
      lien_ket: data.lien_ket || null,
    });
  }

  return notifyAdmins({
    tieu_de: data.tieu_de,
    noi_dung: data.noi_dung,
    loai: data.loai || "he_thong",
    lien_ket: data.lien_ket || null,
  });
};

const getMyNotifications = async (id_nguoi_dung) => {
  const notifications = await notificationRepository.findByUserId(id_nguoi_dung);
  const unreadCount = await notificationRepository.countUnread(id_nguoi_dung);

  return {
    unreadCount,
    notifications,
  };
};

const markAsRead = async (id_thong_bao, id_nguoi_dung) => {
  await notificationRepository.markAsRead(id_thong_bao, id_nguoi_dung);
  return { message: "Da doc thong bao" };
};

const markAllAsRead = async (id_nguoi_dung) => {
  await notificationRepository.markAllAsRead(id_nguoi_dung);
  return { message: "Da doc tat ca thong bao" };
};

module.exports = {
  createNotification,
  createManyNotifications,
  notifyRole,
  notifyAdmins,
  notifyLimitStaffByArea,
  sendAdminNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
