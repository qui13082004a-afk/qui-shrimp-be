const notificationRepository = require("../repositories/notification.repository");

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
  return { message: "Đã đọc thông báo" };
};

const markAllAsRead = async (id_nguoi_dung) => {
  await notificationRepository.markAllAsRead(id_nguoi_dung);
  return { message: "Đã đọc tất cả thông báo" };
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};