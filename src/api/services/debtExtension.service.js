const {
  debtExtensionRepository,
  customerProfileRepository,
} = require("../repositories");

const { sequelize } = require("../../config/database");
const notificationService = require("./notification.service");

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ALLOW_BEFORE_DAYS = 7;
const MAX_EXTENSION_TIMES = 10;
// gia hạn tối đa
const MAX_EXTENSION_DAYS_PER_REQUEST = 60;
const ADMIN_DEBT_EXTENSION_LINK = "/admin/gia-han-thanh-toan";
const getCustomerDebtProfileLink = (id_ho_so) => `/debt/profile/${id_ho_so}`;

// Dua ngay ve 00:00:00 de tinh so ngay chinh xac theo lich.
const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Parse ngay va chan truong hop du lieu rong / sai dinh dang.
const parseValidDate = (value, message) => {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    throw new Error(message);
  }

  return date;
};

// Tinh chenh lech so ngay giua 2 moc thoi gian.
const diffDays = (fromDate, toDate) => {
  const from = toStartOfDay(fromDate);
  const to = toStartOfDay(toDate);
  return Math.ceil((to - from) / MS_PER_DAY);
};

// Rut gon ket qua upload tu nhieu loai storage thanh danh sach duong dan.
const normalizeUploadedImages = (files = []) => {
  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }

  return files
    .map((file) => {
      return (
        file.location ||
        file.url ||
        file.path ||
        file.key ||
        file.filename ||
        null
      );
    })
    .filter(Boolean);
};

// Tao thong bao nhung khong de loi notification lam fail nghiep vu chinh.
const safeCreateNotification = async (payload) => {
  try {
    await notificationService.createNotification(payload);
  } catch (error) {
    console.error("CREATE_NOTIFICATION_ERROR:", error.message);
  }
};

// Gui thong bao den admin nhung van uu tien hoan tat nghiep vu chinh.
const safeNotifyAdmins = async (payload) => {
  try {
    await notificationService.notifyAdmins(payload);
  } catch (error) {
    console.error("NOTIFY_ADMINS_ERROR:", error.message);
  }
};

// Khach hang gui yeu cau gia han cho ho so tra sau cua minh.
const createDebtExtension = async (user, data, files = []) => {
  const { id_ho_so, han_de_xuat, ly_do } = data;

  if (!id_ho_so) {
    throw new Error("Vui lòng chọn hồ sơ công nợ");
  }

  if (!han_de_xuat) {
    throw new Error("Vui lòng chọn hạn thanh toán đề xuất");
  }

  if (!ly_do || !ly_do.trim()) {
    throw new Error("Vui lòng nhập lý do xin gia hạn");
  }

  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ");
  }

  if (Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)) {
    throw new Error("Bạn không có quyền gửi đơn gia hạn cho hồ sơ này");
  }

  if (!profile.duoc_phep_tra_sau) {
    throw new Error("Hồ sơ này chưa được duyệt quyền trả sau");
  }

  if (!profile.han_thanh_toan) {
    throw new Error("Hồ sơ chưa có hạn thanh toán hiện tại");
  }

  const pending = await debtExtensionRepository.findPendingByProfileId(id_ho_so);

  if (pending) {
    throw new Error("Hồ sơ này đang có đơn gia hạn chờ duyệt");
  }

  const approvedCount =
    await debtExtensionRepository.countApprovedByProfileId(id_ho_so);

  if (approvedCount >= MAX_EXTENSION_TIMES) {
    throw new Error(`Hồ sơ này đã gia hạn tối đa ${MAX_EXTENSION_TIMES} lần`);
  }

  // Chuan hoa ngay hien tai, ngay den han va ngay de xuat moi de kiem tra nghiep vu.
  const today = new Date();
  const currentDeadline = parseValidDate(
    profile.han_thanh_toan,
    "Hạn thanh toán hiện tại của hồ sơ không hợp lệ"
  );
  const proposedDeadline = parseValidDate(
    han_de_xuat,
    "Hạn thanh toán đề xuất không hợp lệ"
  );

  const daysUntilDeadline = diffDays(today, currentDeadline);

  if (daysUntilDeadline > ALLOW_BEFORE_DAYS) {
    throw new Error(
      `Chỉ được xin gia hạn khi còn tối đa ${ALLOW_BEFORE_DAYS} ngày đến hạn thanh toán`
    );
  }

  // So ngay gia han phai duong, tuc la han moi phai lon hon han hien tai.
  const extensionDays = diffDays(currentDeadline, proposedDeadline);

  if (extensionDays <= 0) {
    throw new Error("Hạn đề xuất phải lớn hơn hạn thanh toán hiện tại");
  }

  if (extensionDays > MAX_EXTENSION_DAYS_PER_REQUEST) {
    throw new Error(
      `Mỗi lần gia hạn chỉ được tối đa ${MAX_EXTENSION_DAYS_PER_REQUEST} ngày`
    );
  }

  const uploadedImages =
    normalizeUploadedImages(files) || data.hinh_anh_minh_chung || null;

  // Luu don gia han o trang thai cho admin duyet.
  const extension = await debtExtensionRepository.create({
    id_ho_so,
    id_nguoi_gui: user.id_nguoi_dung,
    id_nguoi_duyet: null,
    han_cu: profile.han_thanh_toan,
    han_de_xuat,
    so_ngay_gia_han: extensionDays,
    ly_do: ly_do.trim(),
    ghi_chu: data.ghi_chu || null,
    ly_do_tu_choi: null,
    trang_thai: "cho_duyet",
    ngay_gui: new Date(),
    ngay_duyet: null,
    hinh_anh_minh_chung: uploadedImages,
  });

  await safeCreateNotification({
    id_nguoi_dung: user.id_nguoi_dung,
    tieu_de: "Đã gửi yêu cầu gia hạn",
    noi_dung: `Yêu cầu gia hạn thêm ${extensionDays} ngày đã được gửi và đang chờ duyệt.`,
    loai: "thanh_toan",
    lien_ket: getCustomerDebtProfileLink(id_ho_so),
  });

  const customerName =
    profile.ho_ten || profile.NguoiDung?.ho_ten || user.ho_ten || "Khách hàng";

  await safeNotifyAdmins({
    tieu_de: "Có yêu cầu gia hạn thanh toán mới",
    noi_dung: `Khách hàng ${customerName} vừa gửi yêu cầu gia hạn thanh toán cho hồ sơ #${id_ho_so}.`,
    loai: "thanh_toan",
    lien_ket: ADMIN_DEBT_EXTENSION_LINK,
  });

  return await debtExtensionRepository.findById(extension.id_gia_han);
};

// Khach hang xem danh sach yeu cau gia han cua chinh minh.
const getMyDebtExtensions = async (user) => {
  return await debtExtensionRepository.findByUserId(user.id_nguoi_dung);
};

// Admin xem toan bo yeu cau gia han trong he thong.
const getAllDebtExtensions = async () => {
  return await debtExtensionRepository.findAll();
};

// Xem chi tiet mot yeu cau gia han, co kiem tra quyen xem.
const getDebtExtensionById = async (user, id_gia_han) => {
  const extension = await debtExtensionRepository.findById(id_gia_han);

  if (!extension) {
    throw new Error("Không tìm thấy đơn gia hạn");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(extension.id_nguoi_gui) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem đơn gia hạn này");
  }

  return extension;
};

// Admin duyet yeu cau gia han va dong bo han thanh toan moi cho ho so.
const approveDebtExtension = async (user, id_gia_han, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền duyệt đơn gia hạn");
  }

  // Dung transaction de dam bao duyet don va cap nhat ho so di cung nhau.
  const transaction = await sequelize.transaction();
  let committed = false;

  try {
    const extension = await debtExtensionRepository.findById(id_gia_han, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!extension) {
      throw new Error("Không tìm thấy đơn gia hạn");
    }

    if (extension.trang_thai !== "cho_duyet") {
      throw new Error("Đơn gia hạn này đã được xử lý");
    }

    // Cap nhat trang thai don gia han truoc.
    await debtExtensionRepository.update(
      id_gia_han,
      {
        id_nguoi_duyet: user.id_nguoi_dung,
        trang_thai: "da_duyet",
        ngay_duyet: new Date(),
        ghi_chu: data.ghi_chu || null,
      },
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }
    );

    // Sau do moi cap nhat han thanh toan moi tren ho so cong no.
    const updatedProfile = await customerProfileRepository.update(
      extension.id_ho_so,
      {
        han_thanh_toan: extension.han_de_xuat,
      },
      transaction
    );

    if (!updatedProfile) {
      throw new Error("Không thể cập nhật hạn thanh toán của hồ sơ");
    }

    await transaction.commit();
    committed = true;

    // Thong bao duoc gui sau khi transaction thanh cong.
    await safeCreateNotification({
      id_nguoi_dung: extension.id_nguoi_gui,
      tieu_de: "Gia hạn được duyệt",
      noi_dung: "Yêu cầu gia hạn thanh toán của bạn đã được duyệt.",
      loai: "thanh_toan",
      lien_ket: getCustomerDebtProfileLink(extension.id_ho_so),
    });

    return await debtExtensionRepository.findById(id_gia_han);
  } catch (error) {
    if (!committed) {
      await transaction.rollback();
    }
    throw error;
  }
};

// Admin tu choi yeu cau gia han va luu ro ly do tu choi.
const rejectDebtExtension = async (user, id_gia_han, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền từ chối đơn gia hạn");
  }

  const { ly_do_tu_choi } = data;

  if (!ly_do_tu_choi || !ly_do_tu_choi.trim()) {
    throw new Error("Vui lòng nhập lý do từ chối");
  }

  const extension = await debtExtensionRepository.findById(id_gia_han);

  if (!extension) {
    throw new Error("Không tìm thấy đơn gia hạn");
  }

  if (extension.trang_thai !== "cho_duyet") {
    throw new Error("Đơn gia hạn này đã được xử lý");
  }

  await debtExtensionRepository.update(id_gia_han, {
    id_nguoi_duyet: user.id_nguoi_dung,
    trang_thai: "tu_choi",
    ngay_duyet: new Date(),
    ly_do_tu_choi: ly_do_tu_choi.trim(),
    ghi_chu: data.ghi_chu || null,
  });

  await safeCreateNotification({
    id_nguoi_dung: extension.id_nguoi_gui,
    tieu_de: "Gia hạn bị từ chối",
    noi_dung: `Yêu cầu gia hạn thanh toán của bạn đã bị từ chối. Lý do: ${ly_do_tu_choi}`,
    loai: "thanh_toan",
    lien_ket: getCustomerDebtProfileLink(extension.id_ho_so),
  });

  return await debtExtensionRepository.findById(id_gia_han);
};

// Lay lich su gia han theo tung ho so cong no.
const getDebtExtensionsByProfileId = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ công nợ");
  }

  if (
    user.vai_tro !== "admin" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem lịch sử gia hạn của hồ sơ này");
  }

  return await debtExtensionRepository.findByProfileId(id_ho_so);
};

module.exports = {
  createDebtExtension,
  getMyDebtExtensions,
  getAllDebtExtensions,
  getDebtExtensionById,
  approveDebtExtension,
  rejectDebtExtension,
  getDebtExtensionsByProfileId,
};
