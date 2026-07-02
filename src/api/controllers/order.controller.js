const { orderService } = require("../services");

const createOrder = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: "Tạo đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await orderService.getMyOrders(req.user.id_nguoi_dung);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng của tôi thành công",
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders(req.user);

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.user,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const cancelMyOrder = async (userId, orderId) => {
  const order = await DonHang.findOne({
    where: {
      id_don_hang: orderId,
      id_nguoi_dung: userId,
    },
    include: [
      {
        model: ChiTietDonHang,
        required: false,
        include: [{ model: SanPham, required: false }],
      },
      {
        model: ThanhToan,
        required: false,
      },
    ],
  });

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền hủy");
  }

  const allowedStatus = ["cho_xu_ly", "cho_thanh_toan"];

  if (!allowedStatus.includes(order.trang_thai_don_hang)) {
    throw new Error("Chỉ có thể hủy đơn hàng khi đơn còn chờ xử lý hoặc chờ thanh toán");
  }

  await order.update({
    trang_thai_don_hang: "da_huy",
  });

  return order;
};
module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder
};