const {
  debtExtensionRepository,
  customerProfileRepository,
} = require("../repositories");
const notificationService = require("./notification.service");
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ALLOW_BEFORE_DAYS = 7;

const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const diffDays = (fromDate, toDate) => {
  const from = toStartOfDay(fromDate);
  const to = toStartOfDay(toDate);
  return Math.ceil((to - from) / MS_PER_DAY);
};

const createDebtExtension = async (user, data) => {
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

  const today = new Date();
  const currentDeadline = new Date(profile.han_thanh_toan);
  const proposedDeadline = new Date(han_de_xuat);

  if (Number.isNaN(proposedDeadline.getTime())) {
    throw new Error("Hạn thanh toán đề xuất không hợp lệ");
  }

  const daysUntilDeadline = diffDays(today, currentDeadline);

  if (daysUntilDeadline > ALLOW_BEFORE_DAYS) {
    throw new Error(
      `Chỉ được xin gia hạn khi còn tối đa ${ALLOW_BEFORE_DAYS} ngày đến hạn thanh toán`
    );
  }

  const extensionDays = diffDays(currentDeadline, proposedDeadline);

  if (extensionDays <= 0) {
    throw new Error("Hạn đề xuất phải lớn hơn hạn thanh toán hiện tại");
  }

  return await debtExtensionRepository.create({
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
  });
  await notificationService.createNotification({
  id_nguoi_dung: user.id_nguoi_dung,
  tieu_de: "Đã gửi yêu cầu gia hạn",
  noi_dung: `Yêu cầu gia hạn thêm ${extensionDays} ngày đã được gửi và đang chờ duyệt.`,
  loai: "thanh_toan",
  lien_ket: `/debt/extensions/${extension.id_gia_han}`,
});
};

const getMyDebtExtensions = async (user) => {
  return await debtExtensionRepository.findByUserId(user.id_nguoi_dung);
};

const getAllDebtExtensions = async () => {
  return await debtExtensionRepository.findAll();
};

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

const approveDebtExtension = async (user, id_gia_han, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ admin mới có quyền duyệt đơn gia hạn");
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
    trang_thai: "da_duyet",
    ngay_duyet: new Date(),
    ghi_chu: data.ghi_chu || null,
  });
await notificationService.createNotification({
  id_nguoi_dung: extension.id_nguoi_gui,
  tieu_de: "Gia hạn được duyệt",
  noi_dung: "Yêu cầu gia hạn thanh toán của bạn đã được duyệt.",
  loai: "thanh_toan",
  lien_ket: `/debt/extensions/${id_gia_han}`,
});

  return await debtExtensionRepository.findById(id_gia_han);
};

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
await notificationService.createNotification({
  id_nguoi_dung: extension.id_nguoi_gui,
  tieu_de: "Gia hạn bị từ chối",
  noi_dung: `Yêu cầu gia hạn thanh toán của bạn đã bị từ chối. Lý do: ${ly_do_tu_choi}`,
  loai: "thanh_toan",
  lien_ket: `/debt/extensions/${id_gia_han}`,
});
  return await debtExtensionRepository.findById(id_gia_han);
};
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