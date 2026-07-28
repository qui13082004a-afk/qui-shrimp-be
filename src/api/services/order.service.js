const { sequelize } = require("../../config/database");
const { deliveryRepository, orderRepository } = require("../repositories");
const notificationService = require("./notification.service");
const shippingFeeService = require("./shippingFee.service");
const warehouseSelectionService = require("./warehouseSelection.service");
const inventoryService = require("./inventory.service");

const getOrderStatusText = (status) => {
  const map = {
    cho_xu_ly: "chờ xử lý",
    cho_thanh_toan: "chờ thanh toán",
    da_thanh_toan: "đã thanh toán",
    cho_giao: "chờ giao hàng",
    dang_giao: "đang giao",
    hoan_tat: "hoàn tất",
    giao_that_bai: "giao thất bại",
    da_huy: "đã hủy",
  };

  return map[status] || status;
};

// Chuyen toa do dau vao ve number hop le, neu khong co thi tra ve null.
const toNullableCoordinate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

// Tao loi 403 dung cho cac truong hop sai phan quyen.
const createForbiddenError = (message) => {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
};

// Dam bao nhan vien giao hang chi duoc cap nhat don da duoc phan cong cho chinh minh.
const ensureDeliveryStaffAssignedToOrder = async (user, id_don_hang) => {
  const shipper = await deliveryRepository.findShipperByUserId(
    user.id_nguoi_dung
  );

  if (!shipper) {
    throw createForbiddenError("Khong tim thay thong tin nhan vien giao hang");
  }

  const delivery = await deliveryRepository.findDeliveryByOrderId(id_don_hang);

  if (
    !delivery ||
    Number(delivery.id_nhan_vien_giao) !==
      Number(shipper.id_nhan_vien_giao_hang)
  ) {
    throw createForbiddenError(
      "Ban khong co quyen cap nhat don hang khong duoc phan cong"
    );
  }

  return delivery;
};

// Chuan hoa thong tin giao hang cho don:
// - uu tien lay dia chi da luu neu nguoi dung da chon
// - neu co toa do thi tinh khu vuc/phi ship theo he thong
// - neu thieu toa do thi tam tra ve phi ship dau vao hoac mac dinh = 0
const resolveShippingForOrder = async (userId, data, transaction) => {
  let viDo = toNullableCoordinate(data.vi_do_giao_hang);
  let kinhDo = toNullableCoordinate(data.kinh_do_giao_hang);
  let diaChiGiaoHang = data.dia_chi_giao_hang;
  let idTinhThanhGiaoHang = data.id_tinh_thanh_giao_hang || null;

  if (data.id_dia_chi_giao_hang) {
    const deliveryAddress = await orderRepository.findDeliveryAddressForOrder(
      data.id_dia_chi_giao_hang,
      userId,
      transaction
    );

    if (!deliveryAddress) {
      throw new Error("Khong tim thay dia chi giao hang da chon");
    }

    diaChiGiaoHang = deliveryAddress.dia_chi;
    idTinhThanhGiaoHang = deliveryAddress.id_tinh_thanh || idTinhThanhGiaoHang;
    viDo = toNullableCoordinate(deliveryAddress.vi_do);
    kinhDo = toNullableCoordinate(deliveryAddress.kinh_do);
  }

  if (viDo === null || kinhDo === null) {
    return {
      phi_van_chuyen: Number(data.phi_van_chuyen || 0),
      id_khu_vuc_giao_hang: null,
      id_diem_xuat_phat: null,
      khoang_cach_giao_hang_km: null,
      dia_chi_giao_hang: diaChiGiaoHang,
      vi_do_giao_hang: viDo,
      kinh_do_giao_hang: kinhDo,
    };
  }

  const shipping = await shippingFeeService.calculateShippingFee({
    id_khu_vuc: data.id_khu_vuc_giao_hang,
    id_tinh_thanh: idTinhThanhGiaoHang,
    vi_do: viDo,
    kinh_do: kinhDo,
  });

  return {
    phi_van_chuyen: Number(shipping.phi_van_chuyen || 0),
    id_khu_vuc_giao_hang: shipping.id_khu_vuc || null,
    id_diem_xuat_phat: shipping.id_diem_xuat_phat || null,
    khoang_cach_giao_hang_km: shipping.khoang_cach_km || null,
    dia_chi_giao_hang: diaChiGiaoHang,
    id_tinh_thanh_giao_hang: idTinhThanhGiaoHang,
    vi_do_giao_hang: viDo,
    kinh_do_giao_hang: kinhDo,
  };
};

// Tao moi don hang, dong thoi kiem tra san pham, ton kho,
// tinh phi ship, chon kho xuat, tao payment va gui thong bao.
const createOrder = async (user, data) => {
  const userId = user.id_nguoi_dung;
  let shippingData = await resolveShippingForOrder(userId, data, null);
  const transaction = await sequelize.transaction();

  try {
    let tong_tien = 0;
    const orderDetails = [];
    const productNameById = new Map();

    for (const item of data.items) {
      const product = await orderRepository.findProductById(
        item.id_san_pham,
        transaction
      );

      if (!product) {
        throw new Error(`Sản phẩm (ID: ${item.id_san_pham}) không tồn tại`);
      }

      if (product.trang_thai !== "dang_ban") {
        throw new Error(`Sản phẩm "${product.ten_san_pham}" hiện không bán`);
      }

      const so_luong_dat = Number(item.so_luong_dat);

      if (!so_luong_dat || so_luong_dat <= 0) {
        throw new Error("Số lượng đặt phải lớn hơn 0");
      }

      const gia_ban = Number(product.gia);
      const thanh_tien = gia_ban * so_luong_dat;

      tong_tien += thanh_tien;
      productNameById.set(Number(product.id_san_pham), product.ten_san_pham);

      orderDetails.push({
        id_san_pham: product.id_san_pham,
        id_kho_khach_chon: item.id_kho_hang || item.id_kho_khach_chon || null,
        gia_ban,
        so_luong_dat,
        thanh_tien,
        trang_thai_san_pham: product.trang_thai,
        trang_thai_phan_bo: "cho_phan_bo",
      });
    }

    // Xac dinh trang thai don ban dau va kiem tra dieu kien neu la don tra sau.
    let phi_van_chuyen = shippingData.phi_van_chuyen;
    let tong_thanh_toan = tong_tien + phi_van_chuyen;

    let trang_thai_don_hang = "cho_xu_ly";
    let id_ho_so = null;

    if (data.hinh_thuc_thanh_toan === "chuyen_khoan") {
      trang_thai_don_hang = "cho_thanh_toan";
    }

    if (data.hinh_thuc_thanh_toan === "tra_sau") {
      if (!data.id_vu_nuoi) {
        throw new Error("Vui lòng chọn vụ nuôi khi mua trả sau");
      }

      const profile = await orderRepository.findApprovedPostpaidProfile(
        userId,
        data.id_vu_nuoi,
        transaction
      );

      if (!profile) {
        throw new Error("Vụ nuôi này chưa được Admin duyệt mua trả sau");
      }

      if (profile.bi_khoa_tra_sau) {
        throw new Error(profile.ly_do_khoa || "Hồ sơ đang bị khóa quyền trả sau");
      }

      if (!profile.han_thanh_toan) {
        throw new Error("Hồ sơ chưa có hạn thanh toán");
      }

      const creditLimit = Number(profile.dinh_muc_cong_no || 0);

      if (creditLimit <= 0) {
        throw new Error("Hồ sơ chưa được cấp hạn mức hợp lệ");
      }

      const usedCredit = await orderRepository.getUsedCreditByProfileId(
        profile.id_ho_so,
        transaction
      );

      const remainingCredit = Math.max(creditLimit - usedCredit, 0);

      if (tong_thanh_toan > remainingCredit) {
        throw new Error(
          `Vượt hạn mức trả sau. Hạn mức được cấp: ${creditLimit.toLocaleString()}đ, đã sử dụng: ${usedCredit.toLocaleString()}đ, còn lại: ${remainingCredit.toLocaleString()}đ, đơn mới: ${tong_thanh_toan.toLocaleString()}đ`
        );
      }

      id_ho_so = profile.id_ho_so;
      trang_thai_don_hang = "cho_xu_ly";
    }

    // Chon kho co the dap ung toan bo don va toi uu theo khoang cach/uu tien.
    const allocation = await warehouseSelectionService.chooseBestWarehouse({
      items: orderDetails,
      destination: {
        vi_do: shippingData.vi_do_giao_hang,
        kinh_do: shippingData.kinh_do_giao_hang,
      },
      transaction,
    });

    const selectedWarehouse = allocation.warehouse;

    if (
      shippingData.vi_do_giao_hang !== null &&
      shippingData.kinh_do_giao_hang !== null
    ) {
      // Sau khi da biet kho xuat thuc te, tinh lai phi ship theo kho nay.
      const warehouseShipping = await shippingFeeService.calculateShippingFeeFromWarehouse({
        id_khu_vuc: shippingData.id_khu_vuc_giao_hang || data.id_khu_vuc_giao_hang,
        id_tinh_thanh: shippingData.id_tinh_thanh_giao_hang || data.id_tinh_thanh_giao_hang,
        vi_do: shippingData.vi_do_giao_hang,
        kinh_do: shippingData.kinh_do_giao_hang,
        warehouse: selectedWarehouse,
      });

      shippingData = {
        ...shippingData,
        phi_van_chuyen: Number(warehouseShipping.phi_van_chuyen || 0),
        id_khu_vuc_giao_hang: warehouseShipping.id_khu_vuc || null,
        id_diem_xuat_phat: null,
        khoang_cach_giao_hang_km: warehouseShipping.khoang_cach_km || null,
        shipping_detail: warehouseShipping,
      };

      phi_van_chuyen = shippingData.phi_van_chuyen;
      tong_thanh_toan = tong_tien + phi_van_chuyen;
    }

    if (data.hinh_thuc_thanh_toan === "tra_sau") {
      const profile = await orderRepository.findApprovedPostpaidProfile(
        userId,
        data.id_vu_nuoi,
        transaction
      );

      const creditLimit = Number(profile?.dinh_muc_cong_no || 0);
      const usedCredit = await orderRepository.getUsedCreditByProfileId(
        profile.id_ho_so,
        transaction
      );
      const remainingCredit = Math.max(creditLimit - usedCredit, 0);

      if (tong_thanh_toan > remainingCredit) {
        throw new Error(
          `Vuot han muc tra sau sau khi tinh lai phi van chuyen. Han muc: ${creditLimit.toLocaleString()}d, da su dung: ${usedCredit.toLocaleString()}d, con lai: ${remainingCredit.toLocaleString()}d, don moi: ${tong_thanh_toan.toLocaleString()}d`
        );
      }
    }

    // Danh dau neu kho xuat thuc te khac kho ma nguoi dung mong muon.
    const co_chuyen_kho = orderDetails.some(
      (detail) =>
        detail.id_kho_khach_chon &&
        Number(detail.id_kho_khach_chon) !== Number(selectedWarehouse.id_kho_hang)
    );

    await inventoryService.reserveInventory({
      allocation,
      items: orderDetails,
      transaction,
    });

    // Tao don hang va luu thong tin kho xuat/giao hang thuc te.
    const order = await orderRepository.createOrder(
      {
        id_nguoi_dung: userId,
        id_vu_nuoi: data.id_vu_nuoi || null,
        id_ho_so,
        tong_tien,
        phi_van_chuyen,
        tong_thanh_toan,
        hinh_thuc_thanh_toan: data.hinh_thuc_thanh_toan,
        trang_thai_don_hang,
        dia_chi_giao_hang: shippingData.dia_chi_giao_hang,
        ghi_chu: data.ghi_chu || null,
        id_khu_vuc_giao_hang: shippingData.id_khu_vuc_giao_hang,
        id_diem_xuat_phat: shippingData.id_diem_xuat_phat,
        id_kho_xuat: selectedWarehouse.id_kho_hang,
        co_chuyen_kho,
        khoang_cach_giao_hang_km: shippingData.khoang_cach_giao_hang_km,
        vi_do_giao_hang: shippingData.vi_do_giao_hang,
        kinh_do_giao_hang: shippingData.kinh_do_giao_hang,
      },
      transaction
    );

    const detailsWithOrderId = orderDetails.map((detail) => ({
      ...detail,
      id_don_hang: order.id_don_hang,
      id_kho_xuat_thuc_te: selectedWarehouse.id_kho_hang,
      trang_thai_phan_bo:
        detail.id_kho_khach_chon &&
        Number(detail.id_kho_khach_chon) !== Number(selectedWarehouse.id_kho_hang)
          ? "da_chuyen_kho"
          : "da_phan_bo",
    }));

    await orderRepository.createOrderDetails(detailsWithOrderId, transaction);

    // Chot ton kho thuc te va phat hien cac mat hang sap xuong muc canh bao.
    const confirmedStocks = await inventoryService.confirmInventory({
      order: {
        ChiTietDonHangs: detailsWithOrderId,
      },
      transaction,
    });

    const lowStockAlerts = confirmedStocks.filter((stock) => {
      const minimumStock = Number(stock.ton_kho_toi_thieu || 0);
      return minimumStock > 0 && Number(stock.so_luong || 0) <= minimumStock;
    });

    if (lowStockAlerts.length) {
      await notificationService.notifyAdmins({
        tieu_de: "Canh bao ton kho thap sau khi dat hang",
        noi_dung: lowStockAlerts
          .map((stock) => {
            const productName =
              productNameById.get(Number(stock.id_san_pham)) ||
              `San pham #${stock.id_san_pham}`;

            const warehouseName =
              selectedWarehouse.ten_kho || `kho #${stock.id_kho_hang}`;

            return `${productName} tai ${warehouseName} con ${Number(stock.so_luong || 0).toLocaleString("vi-VN")}/${Number(stock.ton_kho_toi_thieu || 0).toLocaleString("vi-VN")}`;
          })
          .join("; "),
        loai: "he_thong",
        lien_ket: "/admin/san-pham",
        transaction,
      });
    }

    await orderRepository.createPayment(
      {
        id_don_hang: order.id_don_hang,
        so_tien: tong_thanh_toan,
        phuong_thuc: data.hinh_thuc_thanh_toan,
        trang_thai: "cho_thanh_toan",
      },
      transaction
    );

    // Gui thong bao cho khach hang va admin sau khi tao don thanh cong.
    await notificationService.createNotification({
      id_nguoi_dung: userId,
      tieu_de: "Đặt hàng thành công",
      noi_dung: `Đơn hàng #${order.id_don_hang} đã được tạo thành công.`,
      loai: "don_hang",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    await notificationService.notifyAdmins({
      tieu_de: "Có đơn hàng mới",
      noi_dung: `Khách hàng ${user.ho_ten || user.email || `#${userId}`} vừa đặt đơn hàng #${order.id_don_hang} với tổng thanh toán ${Number(tong_thanh_toan || 0).toLocaleString("vi-VN")}đ.`,
      loai: "don_hang",
      lien_ket: `/admin/don-hang`,
      transaction,
    });

    if (co_chuyen_kho) {
      await notificationService.notifyAdmins({
        tieu_de: "Đơn hàng được chuyển kho xuất",
        noi_dung: `Đơn hàng #${order.id_don_hang} được hệ thống phân bổ sang ${selectedWarehouse.ten_kho} vì kho này phù hợp hơn và còn đủ tồn kho.`,
        loai: "he_thong",
        lien_ket: `/admin/don-hang`,
        transaction,
      });
    }

    await transaction.commit();

    return await orderRepository.findById(order.id_don_hang);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Xem truoc don hang truoc khi tao that:
// - tinh tong tien
// - du kien kho xuat
// - du kien phi van chuyen va tong thanh toan
const previewOrder = async (user, data) => {
  const userId = user.id_nguoi_dung;
  let shippingData = await resolveShippingForOrder(userId, data, null);
  let tong_tien = 0;
  const orderDetails = [];

  for (const item of data.items) {
    const product = await orderRepository.findProductById(item.id_san_pham, null);

    if (!product) {
      throw new Error(`Sản phẩm (ID: ${item.id_san_pham}) không tồn tại`);
    }

    if (product.trang_thai !== "dang_ban") {
      throw new Error(`Sản phẩm "${product.ten_san_pham}" hiện không bán`);
    }

    const so_luong_dat = Number(item.so_luong_dat);
    if (!so_luong_dat || so_luong_dat <= 0) {
      throw new Error("Số lượng đặt phải lớn hơn 0");
    }

    const gia_ban = Number(product.gia);
    const thanh_tien = gia_ban * so_luong_dat;
    tong_tien += thanh_tien;

    orderDetails.push({
      id_san_pham: product.id_san_pham,
      id_kho_khach_chon: item.id_kho_hang || item.id_kho_khach_chon || null,
      ten_san_pham: product.ten_san_pham,
      gia_ban,
      so_luong_dat,
      thanh_tien,
    });
  }

  const allocation = await warehouseSelectionService.chooseBestWarehouse({
    items: orderDetails,
    destination: {
      vi_do: shippingData.vi_do_giao_hang,
      kinh_do: shippingData.kinh_do_giao_hang,
    },
    transaction: null,
  });

  const selectedWarehouse = allocation.warehouse;

  if (
    shippingData.vi_do_giao_hang !== null &&
    shippingData.kinh_do_giao_hang !== null
  ) {
    const warehouseShipping = await shippingFeeService.calculateShippingFeeFromWarehouse({
      id_khu_vuc: shippingData.id_khu_vuc_giao_hang || data.id_khu_vuc_giao_hang,
      id_tinh_thanh: shippingData.id_tinh_thanh_giao_hang || data.id_tinh_thanh_giao_hang,
      vi_do: shippingData.vi_do_giao_hang,
      kinh_do: shippingData.kinh_do_giao_hang,
      warehouse: selectedWarehouse,
    });

    shippingData = {
      ...shippingData,
      phi_van_chuyen: Number(warehouseShipping.phi_van_chuyen || 0),
      id_khu_vuc_giao_hang: warehouseShipping.id_khu_vuc || null,
      id_diem_xuat_phat: null,
      khoang_cach_giao_hang_km: warehouseShipping.khoang_cach_km || null,
      shipping_detail: warehouseShipping,
    };
  }

  const co_chuyen_kho = orderDetails.some(
    (detail) =>
      detail.id_kho_khach_chon &&
      Number(detail.id_kho_khach_chon) !== Number(selectedWarehouse.id_kho_hang)
  );

  const phi_van_chuyen = shippingData.phi_van_chuyen;

  return {
    kho_xuat_du_kien: selectedWarehouse,
    co_chuyen_kho,
    khoang_cach_kho_km: allocation.distance_km,
    distance_provider: allocation.distance_provider,
    phi_van_chuyen,
    tong_tien,
    tong_thanh_toan: tong_tien + phi_van_chuyen,
    chi_tiet: orderDetails.map((detail) => ({
      ...detail,
      id_kho_xuat_thuc_te: selectedWarehouse.id_kho_hang,
      trang_thai_phan_bo:
        detail.id_kho_khach_chon &&
        Number(detail.id_kho_khach_chon) !== Number(selectedWarehouse.id_kho_hang)
          ? "da_chuyen_kho"
          : "da_phan_bo",
    })),
    van_chuyen: shippingData.shipping_detail || shippingData,
  };
};

// Lay danh sach don hang cua chinh nguoi dung hien tai.
const getMyOrders = async (userId) => {
  return await orderRepository.findByUserId(userId);
};

// Admin lay toan bo don hang trong he thong.
const getAllOrders = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Bạn không có quyền truy cập toàn bộ đơn hàng");
  }

  return await orderRepository.findAll();
};

// Lay chi tiet mot don hang, co kiem tra quyen truy cap.
const getOrderById = async (user, id_don_hang) => {
  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng yêu cầu");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền truy cập đơn hàng này");
  }

  return order;
};

// Cap nhat trang thai don hang, kem xu ly dong bo ton kho, giao hang va thong bao.
const updateOrderStatus = async (user, id_don_hang, data) => {
  const targetStatus = data.trang_thai_don_hang;

  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Bạn không có quyền chỉnh sửa trạng thái đơn hàng");
  }

  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng cần cập nhật");
  }

  const currentStatus = order.trang_thai_don_hang;

  if (["da_huy", "hoan_tat"].includes(currentStatus)) {
    throw new Error("Đơn hàng đã kết thúc, không thể cập nhật");
  }

  let assignedDelivery = null;

  if (user.vai_tro === "nhan_vien_giao_hang") {
    assignedDelivery = await ensureDeliveryStaffAssignedToOrder(user, id_don_hang);
    const allowedDeliveryStatuses = ["dang_giao", "giao_that_bai"];

    if (targetStatus === "hoan_tat") {
      throw createForbiddenError(
        "Nhan vien giao hang phai xac nhan giao thanh cong bang API giao hang kem chung tu"
      );
    }

    if (!allowedDeliveryStatuses.includes(targetStatus)) {
      throw createForbiddenError("Nhan vien giao hang chi duoc cap nhat don duoc phan cong");
    }

    if (
      targetStatus === "dang_giao" &&
      (currentStatus !== "cho_giao" || assignedDelivery.trang_thai !== "cho_giao")
    ) {
      throw new Error("Đơn hàng chưa ở trạng thái chờ giao");
    }

    if (
      targetStatus === "giao_that_bai" &&
      !["cho_giao", "dang_giao"].includes(assignedDelivery.trang_thai)
    ) {
      throw new Error("Trang thai giao hang khong the chuyen sang that bai");
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const orderForInventory = await orderRepository.findOrderWithDetailsForUpdate(
      id_don_hang,
      transaction
    );

    // Neu don bi huy hoac giao that bai thi tra lai ton kho da giu.
    if (["da_huy", "giao_that_bai"].includes(targetStatus)) {
      await inventoryService.releaseInventory({
        order: orderForInventory,
        transaction,
      });
    }

    // Neu don hoan tat thi chot ton kho xuat thuc te.
    if (targetStatus === "hoan_tat" && currentStatus !== "hoan_tat") {
      await inventoryService.confirmInventory({
        order: orderForInventory,
        transaction,
      });
    }

    if (assignedDelivery) {
      const deliveryForUpdate = await deliveryRepository.findById(
        assignedDelivery.id_giao_hang,
        transaction
      );

      await deliveryRepository.updateDelivery(
        deliveryForUpdate,
        {
          trang_thai:
            targetStatus === "dang_giao" ? "dang_giao" : "giao_that_bai",
          ghi_chu: data.ghi_chu || deliveryForUpdate.ghi_chu,
          thoi_gian_giao:
            targetStatus === "dang_giao"
              ? deliveryForUpdate.thoi_gian_giao || new Date()
              : new Date(),
        },
        transaction
      );
    }

    const updateData = { trang_thai_don_hang: targetStatus };
    if (targetStatus === "da_thanh_toan") updateData.ngay_duyet = new Date();
    if (targetStatus === "hoan_tat") updateData.ngay_giao = new Date();

    await orderRepository.updateOrder(orderForInventory, updateData, transaction);

    await notificationService.createNotification({
      id_nguoi_dung: order.id_nguoi_dung,
      tieu_de: "Cập nhật đơn hàng",
      noi_dung: `Đơn hàng #${order.id_don_hang} đã chuyển sang trạng thái ${getOrderStatusText(
        targetStatus
      )}.`,
      loai: "don_hang",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    await transaction.commit();

    return await orderRepository.findById(id_don_hang);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Khach hang tu huy don cua minh khi don con o trang thai cho xu ly/cho thanh toan.
const cancelMyOrder = async (userId, orderId) => {
  const transaction = await sequelize.transaction();

  try {
    const order = await orderRepository.findOrderWithDetailsForUpdate(
      orderId,
      transaction
    );

    if (!order || Number(order.id_nguoi_dung) !== Number(userId)) {
      throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền hủy");
    }

    const allowedStatus = ["cho_xu_ly", "cho_thanh_toan"];

    if (!allowedStatus.includes(order.trang_thai_don_hang)) {
      throw new Error("Chỉ có thể hủy đơn hàng khi đơn còn chờ xử lý hoặc chờ thanh toán");
    }

    await inventoryService.releaseInventory({ order, transaction });
    await orderRepository.updateOrder(
      order,
      { trang_thai_don_hang: "da_huy" },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: userId,
      tieu_de: "Đơn hàng đã hủy",
      noi_dung: `Đơn hàng #${order.id_don_hang} đã được hủy thành công.`,
      loai: "don_hang",
      lien_ket: `/profile/orders/${order.id_don_hang}`,
      transaction,
    });

    await transaction.commit();

    return await orderRepository.findById(orderId);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  previewOrder,
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  cancelMyOrder,
};
