const { deliveryService } = require("../services");

const getMyDeliveries = async (req, res) => {
  try {
    const deliveries = await deliveryService.getMyDeliveries(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn giao của tôi thành công",
      data: deliveries,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getAllDeliveries = async (req, res) => {
  try {
    const deliveries = await deliveryService.getAllDeliveries(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách giao hàng thành công",
      data: deliveries,
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

const getActiveDeliveryStaffs = async (req, res) => {
  try {
    const staffs = await deliveryService.getActiveDeliveryStaffs(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhân viên giao hàng thành công",
      data: staffs,
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

const getAllDeliveryStaffs = async (req, res) => {
  try {
    const staffs = await deliveryService.getAllDeliveryStaffs(req.user);

    return res.status(200).json({
      success: true,
      message: "Láº¥y toÃ n bá»™ nhÃ¢n viÃªn giao hÃ ng thÃ nh cÃ´ng",
      data: staffs,
    });
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message });
  }
};

const updateDeliveryStaffArea = async (req, res) => {
  try {
    const staff = await deliveryService.updateDeliveryStaffArea(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cáº­p nháº­t khu vá»±c phá»¥ tráº¡ch thÃ nh cÃ´ng",
      data: staff,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const getDeliveryById = async (req, res) => {
  try {
    const delivery = await deliveryService.getDeliveryById(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết giao hàng thành công",
      data: delivery,
    });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const assignDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.assignDelivery(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Phân công giao hàng thành công",
      data: delivery,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const startDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.startDelivery(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Bắt đầu giao hàng thành công",
      data: delivery,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const successDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.successDelivery(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Xác nhận giao hàng thành công",
      data: delivery,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const failDelivery = async (req, res) => {
  try {
    const delivery = await deliveryService.failDelivery(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Xác nhận giao hàng thất bại thành công",
      data: delivery,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyDeliveries,
  getAllDeliveries,
  getActiveDeliveryStaffs,
  getAllDeliveryStaffs,
  updateDeliveryStaffArea,
  getDeliveryById,
  assignDelivery,
  startDelivery,
  successDelivery,
  failDelivery,
};
