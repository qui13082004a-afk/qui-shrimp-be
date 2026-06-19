const { sequelize } = require("../../config/database");
const { orderRepository } = require("../repositories");

/**
 * TIẾN HÀNH ĐẶT ĐƠN HÀNG MỚI (Xử lý Transaction an toàn)
 */
const createOrder = async (user, data) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = user.id_nguoi_dung;
    let tong_tien = 0;
    const orderDetails = [];

    // Duyệt qua từng sản phẩm để xác thực giá bán, tồn kho và trừ kho tạm thời trong phiên giao dịch (Transaction)
    for (const item of data.items) {
      const product = await orderRepository.findProductById(item.id_san_pham, transaction);

      if (!product) {
        throw new Error(`Sản phẩm (ID: ${item.id_san_pham}) không tồn tại trong hệ thống`);
      }

      // Kiểm tra trạng thái kinh doanh của sản phẩm
      if (product.trang_thai !== "dang_ban") {
        throw new Error(`Sản phẩm "${product.ten_san_pham}" hiện đã ngừng kinh doanh hoặc tạm hết hàng`);
      }

      // Kiểm tra số lượng tồn kho thực tế
      if (Number(product.ton_kho) < Number(item.so_luong_dat)) {
        throw new Error(
          `Sản phẩm "${product.ten_san_pham}" không đủ số lượng cung ứng (Yêu cầu: ${item.so_luong_dat}, Tồn kho: ${product.ton_kho})`
        );
      }

      const gia_ban = Number(product.gia);
      const so_luong_dat = Number(item.so_luong_dat);
      const thanh_tien = gia_ban * so_luong_dat;

      tong_tien += thanh_tien;

      // Đưa thông tin vào mảng chuẩn bị ghi nhận chi tiết đơn hàng
      orderDetails.push({
        id_san_pham: product.id_san_pham,
        gia_ban,
        so_luong_dat,
        thanh_tien,
        trang_thai_san_pham: product.trang_thai,
      });

      // Trừ số lượng tồn kho sản phẩm (Sử dụng Transaction để khóa bản ghi)
      const newStock = Number(product.ton_kho) - so_luong_dat;
      await orderRepository.updateProductStock(product, newStock, transaction);
    }

    const phi_van_chuyen = Number(data.phi_van_chuyen || 0);
    const tong_thanh_toan = tong_tien + phi_van_chuyen;

    // Xác định trạng thái đơn hàng ban đầu dựa trên phương thức thanh toán lựa chọn
    let trang_thai_don_hang = "cho_xu_ly";

    if (data.hinh_thuc_thanh_toan === "cod") {
      trang_thai_don_hang = "cho_giao";
    } else if (data.hinh_thuc_thanh_toan === "chuyen_khoan") {
      trang_thai_don_hang = "cho_thanh_toan";
    } else if (data.hinh_thuc_thanh_toan === "tra_sau") {
      
      const profile = await orderRepository.findApprovedPostpaidProfile(userId, data.id_vu_nuoi);

      if (!profile) {
        throw new Error("Vụ nuôi này chưa được xét duyệt hoặc kích hoạt hạn mức tín dụng mua trả sau");
      }

      // Tính toán công nợ hiện tại của khách hàng
      const currentDebt = await orderRepository.getCurrentDebt(userId);
      const creditLimit = Number(profile.dinh_muc_cong_no);

      // Chặn nếu tổng nợ cũ + nợ của đơn hàng mới vượt quá hạn mức được cấp
      if (currentDebt + tong_thanh_toan > creditLimit) {
        throw new Error(
          `Vượt định mức công nợ! Đơn hàng trị giá ${tong_thanh_toan.toLocaleString()}đ vượt quá hạn mức tín dụng còn lại của bạn (Hạn mức: ${creditLimit.toLocaleString()}đ, Nợ hiện tại: ${currentDebt.toLocaleString()}đ)`
        );
      }

      trang_thai_don_hang = "cho_xu_ly"; // Chờ bộ phận kế toán/Admin rà soát đơn mua trả sau
    }

    // 1. Ghi nhận thông tin Đơn hàng mới
    const order = await orderRepository.createOrder(
      {
        id_nguoi_dung: userId,
        id_vu_nuoi: data.id_vu_nuoi || null,
        tong_tien,
        phi_van_chuyen,
        tong_thanh_toan,
        hinh_thuc_thanh_toan: data.hinh_thuc_thanh_toan,
        trang_thai_don_hang,
        dia_chi_giao_hang: data.dia_chi_giao_hang,
        ghi_chu: data.ghi_chu,
      },
      transaction
    );

    // Ghi nhận thông tin chi tiết các mặt hàng trong đơn
    const detailsWithOrderId = orderDetails.map((detail) => ({
      ...detail,
      id_don_hang: order.id_don_hang,
    }));
    await orderRepository.createOrderDetails(detailsWithOrderId, transaction);

    // Khởi tạo bản ghi thanh toán tương ứng cho đơn hàng
    await orderRepository.createPayment(
      {
        id_don_hang: order.id_don_hang,
        so_tien: tong_thanh_toan,
        phuong_thuc: data.hinh_thuc_thanh_toan,
        trang_thai: "cho_thanh_toan", // Mặc định chờ thanh toán khi vừa khởi tạo đơn
      },
      transaction
    );

    // Xác nhận giao dịch thành công toàn vẹn dữ liệu
    await transaction.commit();

    // Trả về thông tin đơn hàng đầy đủ sau khi ghi nhận thành công
    return await orderRepository.findById(order.id_don_hang);
  } catch (error) {
    // Thu hồi hoàn toàn thay đổi nếu xảy ra bất kỳ lỗi gì trong quá trình đặt hàng
    await transaction.rollback();
    throw error;
  }
};

/**
 * LẤY LỊCH SỬ ĐƠN HÀNG CỦA TÔI (Dành cho Khách hàng)
 */
const getMyOrders = async (userId) => {
  return await orderRepository.findByUserId(userId);
};

/**
 * LẤY TOÀN BỘ DANH SÁCH ĐƠN HÀNG HỆ THỐNG (Chỉ dành cho Admin)
 */
const getAllOrders = async (user) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Thao tác bị từ chối: Bạn không có quyền truy cập toàn bộ đơn hàng");
  }
  return await orderRepository.findAll();
};

/**
 * XEM CHI TIẾT ĐƠN HÀNG QUA ID
 */
const getOrderById = async (user, id_don_hang) => {
  const order = await orderRepository.findById(id_don_hang);

  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng yêu cầu");
  }

  //Chỉ Admin hoặc chính khách hàng đặt đơn mới có quyền xem đơn hàng này
  if (user.vai_tro !== "admin" && Number(order.id_nguoi_dung) !== Number(user.id_nguoi_dung)) {
    throw new Error("Bạn không có quyền truy cập thông tin đơn hàng này");
  }

  return order;
};

/**
 * CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Ma trận chuyển đổi trạng thái chặt chẽ)
 */
const updateOrderStatus = async (user, id_don_hang, data) => {
  const targetStatus = data.trang_thai_don_hang;

  // 1. KIỂM TRA PHÂN QUYỀN
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_giao_hang") {
    throw new Error("Bạn không có quyền chỉnh sửa trạng thái đơn hàng này");
  }

  const order = await orderRepository.findById(id_don_hang);
  if (!order) {
    throw new Error("Không tìm thấy thông tin đơn hàng cần cập nhật");
  }

  const currentStatus = order.trang_thai_don_hang;

  // Đơn hàng đã HỦY hoặc hoàn tất giao hàng thì KHÔNG THỂ sửa đổi trạng thái nữa
  if (["da_huy", "hoan_tat"].includes(currentStatus)) {
    throw new Error(`Đơn hàng hiện đã ở trạng thái "${currentStatus.toUpperCase()}", không thể thay đổi trạng thái nữa`);
  }

  // Phân quyền chi tiết cho nhân viên giao hàng (Shipper)
  if (user.vai_tro === "nhan_vien_giao_hang") {
    // Shipper chỉ được phép cập nhật các trạng thái liên quan đến khâu vận hành thực tế
    const allowedDeliveryStatuses = ["dang_giao", "hoan_tat", "giao_that_bai"];
    if (!allowedDeliveryStatuses.includes(targetStatus)) {
      throw new Error("Nhân viên giao hàng chỉ được phép cập nhật trạng thái vận chuyển (Đang giao, Hoàn tất, Thất bại)");
    }
    
    // Shipper không thể tự ý nhận giao đơn khi đơn hàng chưa sẵn sàng ('cho_giao')
    if (currentStatus !== "cho_giao" && targetStatus === "dang_giao") {
      throw new Error("Đơn hàng chưa ở trạng thái chuẩn bị giao. Vui lòng liên hệ Admin để duyệt đơn trước");
    }
  }

  // Thực hiện cập nhật trạng thái mới
  return await orderRepository.updateStatus(id_don_hang, targetStatus);
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};