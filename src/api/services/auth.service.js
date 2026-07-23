const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authRepository, locationRepository } = require("../repositories");
const sendEmail = require("../../helpers/sendEmail");
const { NhanVienGiaoHang } = require("../models");
const {
  normalizeText,
  findProvinceByText,
} = require("../utils/addressNormalizer");
// Hàm tạo mã OTP 6 chữ số ngẫu nhiên
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hàm gửi email an toàn tránh treo luồng chính khi email lỗi
const safeSendEmail = async (to, subject, text) => {
  try {
    await sendEmail(to, subject, text);
  } catch (error) {
    console.log("SEND EMAIL ERROR:", error.message);
  }
};

const normalizeAccountAddress = async (data) => {
  const normalized = { ...data };

  if (normalized.dia_chi !== undefined) {
    normalized.dia_chi = normalizeText(normalized.dia_chi);
  }

  if (normalized.tinh_thanh !== undefined) {
    const provinceText = normalizeText(normalized.tinh_thanh);
    const provinces = await locationRepository.findAllProvinces();
    const matchedProvince = findProvinceByText(provinceText, provinces);

    normalized.tinh_thanh = matchedProvince
      ? matchedProvince.ten_tinh
      : provinceText;
  }

  return normalized;
};

/**
 * ĐĂNG KÝ TÀI KHOẢN MỚI
 */
const register = async (data) => {

  const normalizedAccount = await normalizeAccountAddress(data);
  const { ho_ten, so_dien_thoai, dia_chi, email, mat_khau, tinh_thanh } =
    normalizedAccount;

  // Kiểm tra email duy nhất (Đây là logic nghiệp vụ tầng Database, vẫn phải giữ lại)
  const existedUser = await authRepository.findByEmailOrPhone(
    email,
    so_dien_thoai
  );
  if (existedUser) {
    if (existedUser.email === email) {
      throw new Error("Email này đã được đăng ký trên hệ thống");
    }
  }

  // Mã hóa mật khẩu
  const hashedPassword = await bcrypt.hash(mat_khau, 10);

  // Khởi tạo OTP xác thực tài khoản
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // Hiệu lực 5 phút

  const user = await authRepository.createUser({
    ho_ten,
    so_dien_thoai,
    dia_chi,
    email,
    mat_khau: hashedPassword,
    tinh_thanh,
    vai_tro: "khach_hang",
    trang_thai_tai_khoan: "chua_xac_thuc",
    otp_code: otp,
    otp_expires: otpExpires,
  });

  // Gửi mail OTP kích hoạt tài khoản
  await safeSendEmail(
    email,
    "Mã xác thực tài khoản Đất Tôm",
    `Chào ${ho_ten}, mã OTP xác thực tài khoản của bạn là: ${otp}. Mã này có hiệu lực trong vòng 5 phút.`
  );

  return user;
};

/**
 * XÁC THỰC EMAIL QUA OTP
 */
const verifyEmail = async (email, otp_code) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Tài khoản email không tồn tại trên hệ thống");
  }

  if (user.trang_thai_tai_khoan === "hoat_dong") {
    throw new Error("Tài khoản của bạn đã được xác thực trước đó");
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ Admin để được hỗ trợ.");
  }

  if (user.otp_code !== otp_code) {
    throw new Error("Mã xác thực OTP không chính xác");
  }

  if (new Date() > user.otp_expires) {
    throw new Error("Mã xác thực OTP của bạn đã hết hạn sử dụng");
  }

  // Cập nhật trạng thái kích hoạt tài khoản thành công
  user.trang_thai_tai_khoan = "hoat_dong";
  user.otp_code = null;
  user.otp_expires = null;

  await user.save();

  return user;
};

/**
 * ĐĂNG NHẬP HỆ THỐNG
 */
const login = async (email, mat_khau) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Tài khoản email hoặc mật khẩu không chính xác");
  }

  if (user.trang_thai_tai_khoan === "chua_xac_thuc") {
    throw new Error(
      "Tài khoản chưa được kích hoạt. Vui lòng xác thực email trước khi đăng nhập hệ thống."
    );
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đã bị khóa. Vui lòng liên hệ Admin để được giải quyết.");
  }

  // Đối chiếu mật khẩu băm
  const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);
  if (!isMatch) {
    throw new Error("Tài khoản email hoặc mật khẩu không chính xác");
  }

  // Tạo JWT Token chứa payload bảo mật
  const token = jwt.sign(
    {
      id_nguoi_dung: user.id_nguoi_dung,
      vai_tro: user.vai_tro,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  // Ẩn các thông tin nhạy cảm trước khi trả về Client
  user.mat_khau = undefined;
  user.otp_code = undefined;
  user.otp_expires = undefined;

  return {
    token,
    user,
  };
};

/**
 * GỬI LẠI MÃ OTP XÁC THỰC
 */
const resendOtp = async (email) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Không tìm thấy thông tin tài khoản");
  }

  if (user.trang_thai_tai_khoan === "hoat_dong") {
    throw new Error("Tài khoản của bạn đã kích hoạt rồi");
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản này đang bị khóa");
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otp_code = otp;
  user.otp_expires = otpExpires;

  await user.save();

  await safeSendEmail(
    email,
    "Mã OTP kích hoạt mới",
    `Mã OTP kích hoạt mới của bạn là: ${otp}. Mã có hiệu lực trong vòng 5 phút.`
  );

  return true;
};

/**
 * YÊU CẦU QUÊN MẬT KHẨU (Gửi OTP)
 */
const forgotPassword = async (email) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Email này chưa được đăng ký trên hệ thống");
  }

  if (user.trang_thai_tai_khoan === "chua_xac_thuc") {
    throw new Error(
      "Tài khoản chưa được kích hoạt. Hãy xác thực email trước khi thực hiện đặt lại mật khẩu."
    );
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản của bạn đang bị khóa");
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otp_code = otp;
  user.otp_expires = otpExpires;

  await user.save();

  await safeSendEmail(
    email,
    "Mã thiết lập lại mật khẩu",
    `Mã xác nhận yêu cầu cấp lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
  );

  return true;
};

/**
 * ĐẶT LẠI MẬT KHẨU MỚI BẰNG OTP
 */
const resetPassword = async (email, otp_code, mat_khau_moi) => {
  const user = await authRepository.findByEmail(email);

  if (!user) {
    throw new Error("Không tìm thấy tài khoản");
  }

  if (user.trang_thai_tai_khoan === "chua_xac_thuc") {
    throw new Error("Tài khoản chưa xác thực email");
  }

  if (user.trang_thai_tai_khoan === "khoa") {
    throw new Error("Tài khoản đang bị khóa");
  }

  if (user.otp_code !== otp_code) {
    throw new Error("Mã xác thực OTP không chính xác");
  }

  if (new Date() > user.otp_expires) {
    throw new Error("Mã xác thực OTP đặt lại mật khẩu đã hết hạn");
  }

  const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);

  user.mat_khau = hashedPassword;
  user.otp_code = null;
  user.otp_expires = null;

  await user.save();

  return true;
};

/**
 * CẬP NHẬT THÔNG TIN CÁ NHÂN
 */
const updateProfile = async (userId, updateData) => {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new Error("Không tìm thấy thông tin tài khoản");
  }

  if (
    updateData.so_dien_thoai !== undefined &&
    updateData.so_dien_thoai !== user.so_dien_thoai
  ) {
    const existedPhone = await authRepository.findByPhoneExceptUser(
      updateData.so_dien_thoai,
      userId
    );

    if (existedPhone) {
      throw new Error("Số điện thoại đã được sử dụng bởi tài khoản khác");
    }
  }
  const allowedFields = ["ho_ten", "so_dien_thoai", "dia_chi", "tinh_thanh", "anh_dai_dien"];
  const normalizedUpdateData = await normalizeAccountAddress(updateData);
  
  allowedFields.forEach((field) => {
    if (normalizedUpdateData[field] !== undefined) {
      user[field] = normalizedUpdateData[field];
    }
  });

  await user.save();
  user.mat_khau = undefined;
  user.otp_code = undefined;
  user.otp_expires = undefined;

  return user;
};

/**
 * ĐỔI MẬT KHẨU AN TOÀN
 */
const changePassword = async (userId, mat_khau_cu, mat_khau_moi) => {
  const user = await authRepository.findById(userId);

  if (!user) {
    throw new Error("Không tìm thấy thông tin tài khoản");
  }

  const isMatch = await bcrypt.compare(mat_khau_cu, user.mat_khau);
  if (!isMatch) {
    throw new Error("Mật khẩu hiện tại không chính xác");
  }

  const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
  user.mat_khau = hashedPassword;
  await user.save();

  return true;
};

/**
 * LẤY THÔNG TIN CHI TIẾT TÀI KHOẢN
 */
const layThongTinTaiKhoan = async (idNguoiDung) => {
  const nguoiDung = await authRepository.findByPk(idNguoiDung, {
    attributes: {
      exclude: ["mat_khau", "otp_code", "otp_expires"],
    },
  });

  if (!nguoiDung) {
    throw new Error("Không tìm thấy thông tin người dùng trong hệ thống");
  }

  return nguoiDung;
};
const updateUserRole = async (adminId, id_nguoi_dung, vai_tro) => {
  const validRoles = [
    "admin",
    "khach_hang",
    "nhan_vien_giao_hang",
    "nhan_vien_dinh_muc",
  ];

  if (!validRoles.includes(vai_tro)) {
    throw new Error("Vai trò không hợp lệ");
  }

  if (Number(adminId) === Number(id_nguoi_dung)) {
    throw new Error("Không thể tự thay đổi vai trò của chính mình");
  }

  const user = await authRepository.findById(id_nguoi_dung);

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  const oldRole = user.vai_tro;

  const updatedUser = await authRepository.updateRole(id_nguoi_dung, vai_tro);

  if (vai_tro === "nhan_vien_giao_hang") {
    const existedDeliveryStaff = await NhanVienGiaoHang.findOne({
      where: { id_nguoi_dung },
    });

    if (!existedDeliveryStaff) {
      await NhanVienGiaoHang.create({
        id_nguoi_dung,
        khu_vuc_phu_trach: null,
        ngay_bat_dau: new Date(),
        trang_thai: "dang_lam",
        ngay_lam_viec: null,
        ghi_chu: "Tự động tạo khi Admin cấp vai trò nhân viên giao hàng",
      });
    } else {
      await existedDeliveryStaff.update({
        trang_thai: "dang_lam",
        ghi_chu: existedDeliveryStaff.ghi_chu || "Kích hoạt lại khi Admin cấp vai trò nhân viên giao hàng",
      });
    }
  }

  if (oldRole === "nhan_vien_giao_hang" && vai_tro !== "nhan_vien_giao_hang") {
    const deliveryStaff = await NhanVienGiaoHang.findOne({
      where: { id_nguoi_dung },
    });

    if (deliveryStaff) {
      await deliveryStaff.update({
        trang_thai: "nghi",
        ghi_chu: "Tự động chuyển nghỉ khi Admin đổi khỏi vai trò nhân viên giao hàng",
      });
    }
  }

  return updatedUser;
};
const getAllUsers = async (query) => {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 10), 1), 100);

  const result = await authRepository.findAllUsers({
    search: query.search || "",
    vai_tro: query.vai_tro || "tat_ca",
    trang_thai_tai_khoan: query.trang_thai_tai_khoan || "tat_ca",
    page,
    limit,
  });

  return {
    items: result.rows,
    pagination: {
      page,
      limit,
      total: result.count,
      totalPages: Math.ceil(result.count / limit),
    },
  };
};

const getUserById = async (id_nguoi_dung) => {
  const user = await authRepository.findUserSafeById(id_nguoi_dung);

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  return user;
};

const updateUserStatus = async (adminId, id_nguoi_dung, trang_thai_tai_khoan) => {
  const validStatuses = ["chua_xac_thuc", "hoat_dong", "khoa"];

  if (!validStatuses.includes(trang_thai_tai_khoan)) {
    throw new Error("Trạng thái tài khoản không hợp lệ");
  }

  if (Number(adminId) === Number(id_nguoi_dung)) {
    throw new Error("Không thể tự thay đổi trạng thái tài khoản của chính mình");
  }

  const user = await authRepository.findById(id_nguoi_dung);

  if (!user) {
    throw new Error("Không tìm thấy người dùng");
  }

  return await authRepository.updateStatus(id_nguoi_dung, trang_thai_tai_khoan);
};
module.exports = {
  register,
  verifyEmail,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
  layThongTinTaiKhoan,
  updateUserRole,
  getAllUsers,
  getUserById,
  updateUserStatus
};
