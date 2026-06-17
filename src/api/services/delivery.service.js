const { deliveryRepository } = require("../repositories");

const getMyDeliveries = async (user) => {
  if (user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Chỉ nhân viên giao hàng mới có quyền xem đơn giao của mình");
  }

  const shipper = await deliveryRepository.findShipperByUserId(user.id_nguoi_dung);

  if (!shipper) {
    throw new Error("Không tìm thấy thông tin nhân viên giao hàng");
  }

  return await deliveryRepository.findByShipperId(shipper.id_nhan_vien_giao_hang);
};

const getAllDeliveries = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền xem tất cả giao hàng");
  }

  return await deliveryRepository.findAll();
};

const getDeliveryById = async (user, id_giao_hang) => {
  const delivery = await deliveryRepository.findById(id_giao_hang);

  if (!delivery) {
    throw new Error("Không tìm thấy giao hàng");
  }

  if (user.vai_tro === "admin") {
    return delivery;
  }

  if (user.vai_tro === "nhan_vien_giao_hang") {
    const shipper = await deliveryRepository.findShipperByUserId(user.id_nguoi_dung);

    if (
      shipper &&
      Number(delivery.id_nhan_vien_giao) === Number(shipper.id_nhan_vien_giao_hang)
    ) {
      return delivery;
    }
  }

  throw new Error("Bạn không có quyền xem giao hàng này");
};

const assignDelivery = async (user, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền phân công giao hàng");
  }

  if (!data.id_don_hang) {
    throw new Error("Vui lòng chọn đơn hàng");
  }

  if (!data.id_nhan_vien_giao) {
    throw new Error("Vui lòng chọn nhân viên giao hàng");
  }

  const order = await deliveryRepository.findOrderById(data.id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy đơn hàng");
  }

  if (!["cho_giao", "da_thanh_toan"].includes(order.trang_thai_don_hang)) {
    throw new Error("Đơn hàng chưa sẵn sàng để giao");
  }

  const existedDelivery = await deliveryRepository.findDeliveryByOrderId(data.id_don_hang);

  if (existedDelivery) {
    throw new Error("Đơn hàng này đã được phân công giao hàng");
  }

  const delivery = await deliveryRepository.create({
    id_don_hang: data.id_don_hang,
    id_nhan_vien_giao: data.id_nhan_vien_giao,
    trang_thai: "cho_giao",
    ghi_chu: data.ghi_chu,
  });

  await deliveryRepository.updateOrder(order, {
    trang_thai_don_hang: "cho_giao",
  });

  return delivery;
};

const startDelivery = async (user, id_giao_hang) => {
  const delivery = await getDeliveryById(user, id_giao_hang);

  if (delivery.trang_thai !== "cho_giao") {
    throw new Error("Chỉ đơn đang chờ giao mới được bắt đầu giao");
  }

  await deliveryRepository.updateDelivery(delivery, {
    trang_thai: "dang_giao",
    thoi_gian_giao: new Date(),
  });

  await deliveryRepository.updateOrder(delivery.DonHang, {
    trang_thai_don_hang: "dang_giao",
  });

  return await deliveryRepository.findById(id_giao_hang);
};

const successDelivery = async (user, id_giao_hang, data) => {
  const delivery = await getDeliveryById(user, id_giao_hang);

  if (delivery.trang_thai !== "dang_giao") {
    throw new Error("Chỉ đơn đang giao mới được xác nhận giao thành công");
  }

  await deliveryRepository.updateDelivery(delivery, {
    trang_thai: "giao_thanh_cong",
    anh_bien_nhan: data.anh_bien_nhan,
    anh_hop_dong: data.anh_hop_dong,
    ghi_chu: data.ghi_chu,
    thoi_gian_giao: new Date(),
  });

  await deliveryRepository.updateOrder(delivery.DonHang, {
    trang_thai_don_hang: "hoan_tat",
    ngay_giao: new Date(),
  });

  return await deliveryRepository.findById(id_giao_hang);
};

const failDelivery = async (user, id_giao_hang, data) => {
  const delivery = await getDeliveryById(user, id_giao_hang);

  if (!["cho_giao", "dang_giao"].includes(delivery.trang_thai)) {
    throw new Error("Trạng thái giao hàng không thể chuyển sang thất bại");
  }

  await deliveryRepository.updateDelivery(delivery, {
    trang_thai: "giao_that_bai",
    ghi_chu: data.ly_do_that_bai || data.ghi_chu,
    thoi_gian_giao: new Date(),
  });

  await deliveryRepository.updateOrder(delivery.DonHang, {
    trang_thai_don_hang: "giao_that_bai",
  });

  return await deliveryRepository.findById(id_giao_hang);
};

module.exports = {
  getMyDeliveries,
  getAllDeliveries,
  getDeliveryById,
  assignDelivery,
  startDelivery,
  successDelivery,
  failDelivery,
};