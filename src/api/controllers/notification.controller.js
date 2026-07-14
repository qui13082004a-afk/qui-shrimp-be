const notificationService = require("../services/notification.service");

const getMyNotifications = async (req, res) => {
  try {
    const id_nguoi_dung = req.user.id_nguoi_dung;

    const result = await notificationService.getMyNotifications(id_nguoi_dung);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const id_nguoi_dung = req.user.id_nguoi_dung;
    const { id } = req.params;

    const result = await notificationService.markAsRead(id, id_nguoi_dung);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const id_nguoi_dung = req.user.id_nguoi_dung;

    const result = await notificationService.markAllAsRead(id_nguoi_dung);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const sendAdminNotification = async (req, res) => {
  try {
    const result = await notificationService.sendAdminNotification(
      req.user,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Gui thong bao thanh cong",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendAdminNotification,
};
