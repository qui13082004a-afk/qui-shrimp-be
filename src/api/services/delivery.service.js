const {
  deliveryRepository,
  paymentRepository,
  locationRepository,
} = require("../repositories");
const notificationService = require("./notification.service");
const inventoryService = require("./inventory.service");
const { sequelize } = require("../../config/database");

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

const getActiveDeliveryStaffs = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền xem nhân viên giao hàng");
  }

  return await deliveryRepository.findActiveShippers();
};

const getAllDeliveryStaffs = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chá»‰ admin má»›i cÃ³ quyá»n xem nhÃ¢n viÃªn giao hÃ ng");
  }

  return await deliveryRepository.findAllShippers();
};

const updateDeliveryStaffArea = async (user, id_nhan_vien_giao_hang, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chá»‰ admin má»›i cÃ³ quyá»n cáº­p nháº­t khu vá»±c phá»¥ tráº¡ch");
  }

  if (!data.id_tinh_thanh || !data.id_phuong_xa) {
    throw new Error("Vui lÃ²ng chá»n tá»‰nh/thÃ nh vÃ  phÆ°á»ng/xÃ£ phá»¥ tráº¡ch");
  }

  const shipper = await deliveryRepository.findShipperById(id_nhan_vien_giao_hang);

  if (!shipper) {
    throw new Error("KhÃ´ng tÃ¬m tháº¥y nhÃ¢n viÃªn giao hÃ ng");
  }

  const province = await locationRepository.findProvinceById(data.id_tinh_thanh);
  if (!province) {
    throw new Error("Tá»‰nh/thÃ nh khÃ´ng tá»“n táº¡i");
  }

  const ward = await locationRepository.findWardById(data.id_phuong_xa);
  if (!ward) {
    throw new Error("PhÆ°á»ng/xÃ£ khÃ´ng tá»“n táº¡i");
  }

  if (Number(ward.id_tinh_thanh) !== Number(province.id_tinh_thanh)) {
    throw new Error("PhÆ°á»ng/xÃ£ khÃ´ng thuá»™c tá»‰nh/thÃ nh Ä‘Ã£ chá»n");
  }

  const khuVucPhuTrach = [
    (data.mo_ta_khu_vuc || "").trim(),
    ward.ten_xa,
    province.ten_tinh,
  ]
    .filter(Boolean)
    .join(", ");

  await deliveryRepository.updateShipper(shipper, {
    khu_vuc_phu_trach: khuVucPhuTrach,
  });

  return await deliveryRepository.findShipperById(id_nhan_vien_giao_hang);
};

const getDeliveryById = async (user, id_giao_hang) => {
  const delivery = await deliveryRepository.findById(id_giao_hang);

  if (!delivery) {
    throw new Error("Không tìm thấy giao hàng");
  }

  if (user.vai_tro === "admin") return delivery;

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

  if (!data.id_don_hang) throw new Error("Vui lòng chọn đơn hàng");
  if (!data.id_nhan_vien_giao) throw new Error("Vui lòng chọn nhân viên giao hàng");

  const transaction = await sequelize.transaction();

  try {
    const order = await deliveryRepository.findOrderById(data.id_don_hang);

    if (!order) throw new Error("Không tìm thấy đơn hàng");

    if (!["cho_giao", "da_thanh_toan"].includes(order.trang_thai_don_hang)) {
      throw new Error("Đơn hàng chưa sẵn sàng để giao");
    }

    const existedDelivery = await deliveryRepository.findDeliveryByOrderId(data.id_don_hang);

    if (existedDelivery) {
      throw new Error("Đơn hàng này đã được phân công giao hàng");
    }

    const shipper = await deliveryRepository.findShipperById(data.id_nhan_vien_giao);

    if (!shipper) {
      throw new Error("Không tìm thấy nhân viên giao hàng");
    }

    const delivery = await deliveryRepository.create(
      {
        id_don_hang: data.id_don_hang,
        id_nhan_vien_giao: data.id_nhan_vien_giao,
        id_kho_xuat: order.id_kho_xuat || null,
        trang_thai: "cho_giao",
        ghi_chu: data.ghi_chu,
      },
      transaction
    );

    await deliveryRepository.updateOrder(
      order,
      {
        trang_thai_don_hang: "cho_giao",
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: order.id_nguoi_dung,
      tieu_de: "Đơn hàng chuẩn bị giao",
      noi_dung: `Đơn hàng #${order.id_don_hang} đã được phân công giao hàng.`,
      loai: "giao_hang",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    await notificationService.createNotification({
      id_nguoi_dung: shipper.id_nguoi_dung,
      tieu_de: "Có đơn giao hàng mới",
      noi_dung: `Bạn vừa được phân công giao đơn hàng #${order.id_don_hang}.`,
      loai: "giao_hang",
      lien_ket: `/delivery/orders/${delivery.id_giao_hang}`,
      transaction,
    });

    await transaction.commit();
    return delivery;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const startDelivery = async (user, id_giao_hang) => {
  const transaction = await sequelize.transaction();

  try {
    const delivery = await getDeliveryById(user, id_giao_hang);

    if (delivery.trang_thai !== "cho_giao") {
      throw new Error("Chỉ đơn đang chờ giao mới được bắt đầu giao");
    }

    await deliveryRepository.updateDelivery(
      delivery,
      {
        trang_thai: "dang_giao",
        thoi_gian_giao: new Date(),
      },
      transaction
    );

    await deliveryRepository.updateOrder(
      delivery.DonHang,
      {
        trang_thai_don_hang: "dang_giao",
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: delivery.DonHang.id_nguoi_dung,
      tieu_de: "Đơn hàng đang giao",
      noi_dung: `Đơn hàng #${delivery.DonHang.id_don_hang} đang được giao đến bạn.`,
      loai: "giao_hang",
      lien_ket: `/profile/orders/${delivery.DonHang.id_don_hang}`,
      transaction,
    });

    await transaction.commit();
    return await deliveryRepository.findById(id_giao_hang);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const successDelivery = async (user, id_giao_hang, data) => {
  const transaction = await sequelize.transaction();

  try {
    const delivery = await getDeliveryById(user, id_giao_hang);

    if (delivery.trang_thai !== "dang_giao") {
      throw new Error("Chỉ đơn đang giao mới được xác nhận giao thành công");
    }

    const paymentMethod = delivery.DonHang?.hinh_thuc_thanh_toan;

    if (!data.anh_bien_nhan) {
      throw new Error("Vui lòng tải ảnh biên nhận giao hàng");
    }

    if (paymentMethod === "tra_sau" && !data.anh_hop_dong) {
      throw new Error("Vui lòng tải giấy xác nhận trả sau");
    }

    const payments = delivery.DonHang?.ThanhToans || [];
    const payment =
      payments.find((item) => item.phuong_thuc === paymentMethod) || payments[0];

    if (!payment) {
      throw new Error("Khong tim thay giao dich thanh toan cua don hang");
    }

    if (paymentMethod === "chuyen_khoan" && payment.trang_thai !== "thanh_cong") {
      throw new Error(
        "Don chuyen khoan chi duoc giao thanh cong sau khi thanh toan da duoc xac minh"
      );
    }

    if (paymentMethod === "cod") {
      await paymentRepository.updatePayment(
        payment,
        {
          trang_thai: "thanh_cong",
          ngay_thanh_toan: new Date(),
          ma_giao_dich:
            payment.ma_giao_dich || `COD-${delivery.DonHang.id_don_hang}`,
        },
        transaction
      );
    }

    if (paymentMethod === "tra_sau") {
      await paymentRepository.updatePayment(
        payment,
        {
          trang_thai: "thanh_cong",
          ngay_thanh_toan: new Date(),
          ma_giao_dich:
            payment.ma_giao_dich || `TRA_SAU-${delivery.DonHang.id_don_hang}`,
        },
        transaction
      );
    }

    await inventoryService.confirmInventory({
      order: delivery.DonHang,
      transaction,
    });

    await deliveryRepository.updateDelivery(
      delivery,
      {
        trang_thai: "giao_thanh_cong",
        anh_bien_nhan: data.anh_bien_nhan,
        anh_hop_dong: data.anh_hop_dong,
        ghi_chu: data.ghi_chu,
        thoi_gian_giao: new Date(),
      },
      transaction
    );

    await deliveryRepository.updateOrder(
      delivery.DonHang,
      {
        trang_thai_don_hang: "hoan_tat",
        ngay_giao: new Date(),
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: delivery.DonHang.id_nguoi_dung,
      tieu_de: "Giao hàng thành công",
      noi_dung: `Đơn hàng #${delivery.DonHang.id_don_hang} đã được giao thành công.`,
      loai: "giao_hang",
      lien_ket: `/profile/orders/${delivery.DonHang.id_don_hang}`,
      transaction,
    });

    await transaction.commit();

    return await deliveryRepository.findById(id_giao_hang);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const failDelivery = async (user, id_giao_hang, data) => {
  const transaction = await sequelize.transaction();

  try {
    const delivery = await getDeliveryById(user, id_giao_hang);

    if (!["cho_giao", "dang_giao"].includes(delivery.trang_thai)) {
      throw new Error("Trạng thái giao hàng không thể chuyển sang thất bại");
    }

    await inventoryService.releaseInventory({
      order: delivery.DonHang,
      transaction,
    });

    await deliveryRepository.updateDelivery(
      delivery,
      {
        trang_thai: "giao_that_bai",
        ghi_chu: data.ly_do_that_bai || data.ghi_chu,
        thoi_gian_giao: new Date(),
      },
      transaction
    );

    await deliveryRepository.updateOrder(
      delivery.DonHang,
      {
        trang_thai_don_hang: "giao_that_bai",
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: delivery.DonHang.id_nguoi_dung,
      tieu_de: "Giao hàng thất bại",
      noi_dung: `Đơn hàng #${delivery.DonHang.id_don_hang} giao thất bại. Vui lòng kiểm tra lại thông tin đơn hàng.`,
      loai: "giao_hang",
      lien_ket: `/profile/orders/${delivery.DonHang.id_don_hang}`,
      transaction,
    });

    await transaction.commit();

    return await deliveryRepository.findById(id_giao_hang);
  } catch (error) {
    await transaction.rollback();
    throw error;
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
