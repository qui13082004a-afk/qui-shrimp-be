const { sequelize } = require("../../config/database");
const {
  thoaThuanBaBenRepository,
  customerProfileRepository,
  thuongLaiRepository,
} = require("../repositories");

const notificationService = require("./notification.service");

const toNumber = (value) => Number(value || 0);

const requestAgreement = async (user, data) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền yêu cầu lập thỏa thuận ba bên");
  }

  if (!data.id_ho_so) {
    throw new Error("Vui lòng chọn hồ sơ mua trả sau");
  }

  if (!data.id_nhan_vien_phu_trach) {
    throw new Error("Vui lòng chọn nhân viên định mức phụ trách");
  }

  if (!data.ly_do_yeu_cau || !data.ly_do_yeu_cau.trim()) {
    throw new Error("Vui lòng nhập lý do yêu cầu lập thỏa thuận");
  }

  const profile = await customerProfileRepository.findById(data.id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ mua trả sau");
  }

  if (!profile.duoc_phep_tra_sau || profile.trang_thai_ho_so !== "da_duyet") {
    throw new Error("Chỉ yêu cầu thỏa thuận cho hồ sơ đã được duyệt trả sau");
  }

  const active = await thoaThuanBaBenRepository.findActiveByProfileId(
    data.id_ho_so
  );

  if (active) {
    throw new Error("Hồ sơ này đã có thỏa thuận ba bên đang hiệu lực");
  }

  const agreement = await thoaThuanBaBenRepository.create({
    id_ho_so: data.id_ho_so,
    id_thuong_lai: null,
    id_admin_yeu_cau: user.id_nguoi_dung,
    id_nhan_vien_phu_trach: data.id_nhan_vien_phu_trach,
    id_nhan_vien_upload: null,
    id_admin_xac_nhan: null,
    gia_tri_han_muc: toNumber(data.gia_tri_han_muc || profile.dinh_muc_cong_no),
    ly_do_yeu_cau: data.ly_do_yeu_cau.trim(),
    noi_dung_thoa_thuan: data.noi_dung_thoa_thuan || null,
    file_thoa_thuan: null,
    ngay_yeu_cau: new Date(),
    ngay_upload: null,
    ngay_ky: null,
    ngay_xac_nhan: null,
    ngay_hieu_luc: null,
    ngay_het_hieu_luc: data.ngay_het_hieu_luc || null,
    trang_thai: "cho_lap",
    ly_do_huy: null,
    ghi_chu: data.ghi_chu || null,
  });

  await notificationService.createNotification({
    id_nguoi_dung: data.id_nhan_vien_phu_trach,
    tieu_de: "Yêu cầu lập thỏa thuận ba bên",
    noi_dung: `Admin yêu cầu lập thỏa thuận ba bên cho hồ sơ #${data.id_ho_so}.`,
    loai: "cong_no",
    lien_ket: `/agreements/${agreement.id_thoa_thuan}`,
  });

  return await thoaThuanBaBenRepository.findById(agreement.id_thoa_thuan);
};

const prepareAgreement = async (user, id_thoa_thuan, data) => {
  if (user.vai_tro !== "nhan_vien_dinh_muc" && user.vai_tro !== "admin") {
    throw new Error("Chỉ nhân viên định mức hoặc Admin mới được cập nhật thỏa thuận");
  }

  const agreement = await thoaThuanBaBenRepository.findById(id_thoa_thuan);

  if (!agreement) {
    throw new Error("Không tìm thấy thỏa thuận ba bên");
  }

  if (
    user.vai_tro === "nhan_vien_dinh_muc" &&
    Number(agreement.id_nhan_vien_phu_trach) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không phải nhân viên phụ trách thỏa thuận này");
  }

  if (!["cho_lap", "cho_ky"].includes(agreement.trang_thai)) {
    throw new Error("Chỉ được cập nhật thỏa thuận ở trạng thái chờ lập hoặc chờ ký");
  }

  if (!data.id_thuong_lai) {
    throw new Error("Vui lòng chọn thương lái");
  }

  const merchant = await thuongLaiRepository.findById(data.id_thuong_lai);

  if (!merchant) {
    throw new Error("Không tìm thấy thương lái");
  }

  if (merchant.trang_thai !== "hoat_dong") {
    throw new Error("Thương lái hiện không hoạt động");
  }

  await thoaThuanBaBenRepository.update(id_thoa_thuan, {
    id_thuong_lai: data.id_thuong_lai,
    noi_dung_thoa_thuan: data.noi_dung_thoa_thuan || agreement.noi_dung_thoa_thuan,
    gia_tri_han_muc:
      data.gia_tri_han_muc !== undefined
        ? toNumber(data.gia_tri_han_muc)
        : agreement.gia_tri_han_muc,
    ngay_het_hieu_luc:
      data.ngay_het_hieu_luc !== undefined
        ? data.ngay_het_hieu_luc
        : agreement.ngay_het_hieu_luc,
    trang_thai: "cho_ky",
    ghi_chu: data.ghi_chu || agreement.ghi_chu,
  });

  return await thoaThuanBaBenRepository.findById(id_thoa_thuan);
};

const uploadSignedAgreement = async (user, id_thoa_thuan, data) => {
  if (user.vai_tro !== "nhan_vien_dinh_muc" && user.vai_tro !== "admin") {
    throw new Error("Chỉ nhân viên định mức hoặc Admin mới được upload thỏa thuận");
  }

  if (!data.file_thoa_thuan) {
    throw new Error("Vui lòng tải file thỏa thuận đã ký");
  }

  const agreement = await thoaThuanBaBenRepository.findById(id_thoa_thuan);

  if (!agreement) {
    throw new Error("Không tìm thấy thỏa thuận ba bên");
  }

  if (
    user.vai_tro === "nhan_vien_dinh_muc" &&
    Number(agreement.id_nhan_vien_phu_trach) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không phải nhân viên phụ trách thỏa thuận này");
  }

  if (!["cho_ky", "cho_xac_nhan"].includes(agreement.trang_thai)) {
    throw new Error("Thỏa thuận chưa ở trạng thái được phép upload");
  }

  await thoaThuanBaBenRepository.update(id_thoa_thuan, {
    file_thoa_thuan: data.file_thoa_thuan,
    id_nhan_vien_upload: user.id_nguoi_dung,
    ngay_upload: new Date(),
    ngay_ky: data.ngay_ky || new Date(),
    trang_thai: "cho_xac_nhan",
    ghi_chu: data.ghi_chu || agreement.ghi_chu,
  });

  await notificationService.createNotification({
    id_nguoi_dung: agreement.id_admin_yeu_cau,
    tieu_de: "Thỏa thuận ba bên chờ xác nhận",
    noi_dung: `Nhân viên đã upload thỏa thuận ba bên #${id_thoa_thuan}, chờ Admin xác nhận.`,
    loai: "cong_no",
    lien_ket: `/agreements/${id_thoa_thuan}`,
  });

  return await thoaThuanBaBenRepository.findById(id_thoa_thuan);
};

const confirmAgreement = async (user, id_thoa_thuan, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền xác nhận thỏa thuận");
  }

  const transaction = await sequelize.transaction();

  try {
    const agreement = await thoaThuanBaBenRepository.findById(
      id_thoa_thuan,
      transaction
    );

    if (!agreement) {
      throw new Error("Không tìm thấy thỏa thuận ba bên");
    }

    if (agreement.trang_thai !== "cho_xac_nhan") {
      throw new Error("Chỉ xác nhận thỏa thuận đang chờ xác nhận");
    }

    if (!agreement.file_thoa_thuan) {
      throw new Error("Thỏa thuận chưa có file đã ký");
    }

    await thoaThuanBaBenRepository.update(
      id_thoa_thuan,
      {
        id_admin_xac_nhan: user.id_nguoi_dung,
        ngay_xac_nhan: new Date(),
        ngay_hieu_luc: data.ngay_hieu_luc || new Date(),
        ngay_het_hieu_luc:
          data.ngay_het_hieu_luc || agreement.ngay_het_hieu_luc,
        trang_thai: "da_hieu_luc",
        ghi_chu: data.ghi_chu || agreement.ghi_chu,
      },
      transaction
    );

    if (agreement.id_thuong_lai) {
      const merchant = agreement.ThuongLai;
      if (merchant) {
        await thuongLaiRepository.update(
          agreement.id_thuong_lai,
          {
            so_lan_tham_gia: Number(merchant.so_lan_tham_gia || 0) + 1,
          },
          transaction
        );
      }
    }

    await notificationService.createNotification({
      id_nguoi_dung: agreement.HoSoKhachHang.id_nguoi_dung,
      tieu_de: "Thỏa thuận ba bên có hiệu lực",
      noi_dung: "Thỏa thuận ba bên của hồ sơ mua trả sau đã được Admin xác nhận.",
      loai: "cong_no",
      lien_ket: `/customer-profile/${agreement.id_ho_so}`,
      transaction,
    });

    await transaction.commit();

    return await thoaThuanBaBenRepository.findById(id_thoa_thuan);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const cancelAgreement = async (user, id_thoa_thuan, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền hủy thỏa thuận");
  }

  if (!data.ly_do_huy || !data.ly_do_huy.trim()) {
    throw new Error("Vui lòng nhập lý do hủy thỏa thuận");
  }

  const agreement = await thoaThuanBaBenRepository.findById(id_thoa_thuan);

  if (!agreement) {
    throw new Error("Không tìm thấy thỏa thuận ba bên");
  }

  if (agreement.trang_thai === "huy") {
    throw new Error("Thỏa thuận đã bị hủy trước đó");
  }

  await thoaThuanBaBenRepository.update(id_thoa_thuan, {
    trang_thai: "huy",
    ly_do_huy: data.ly_do_huy.trim(),
    ghi_chu: data.ghi_chu || agreement.ghi_chu,
  });

  return await thoaThuanBaBenRepository.findById(id_thoa_thuan);
};

const getAllAgreements = async (user) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_dinh_muc") {
    throw new Error("Bạn không có quyền xem danh sách thỏa thuận");
  }

  if (user.vai_tro === "nhan_vien_dinh_muc") {
    return await thoaThuanBaBenRepository.findByStaffId(user.id_nguoi_dung);
  }

  return await thoaThuanBaBenRepository.findAll();
};

const getMyAgreements = async (user) => {
  const all = await thoaThuanBaBenRepository.findAll();

  return all.filter(
    (item) =>
      Number(item.HoSoKhachHang?.id_nguoi_dung) ===
      Number(user.id_nguoi_dung)
  );
};

const getAgreementById = async (user, id_thoa_thuan) => {
  const agreement = await thoaThuanBaBenRepository.findById(id_thoa_thuan);

  if (!agreement) {
    throw new Error("Không tìm thấy thỏa thuận ba bên");
  }

  const isOwner =
    Number(agreement.HoSoKhachHang?.id_nguoi_dung) ===
    Number(user.id_nguoi_dung);

  const isStaff =
    Number(agreement.id_nhan_vien_phu_trach) === Number(user.id_nguoi_dung);

  if (user.vai_tro !== "admin" && !isOwner && !isStaff) {
    throw new Error("Bạn không có quyền xem thỏa thuận này");
  }

  return agreement;
};

const getAgreementsByProfileId = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ");
  }

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem thỏa thuận của hồ sơ này");
  }

  return await thoaThuanBaBenRepository.findByProfileId(id_ho_so);
};

module.exports = {
  requestAgreement,
  prepareAgreement,
  uploadSignedAgreement,
  confirmAgreement,
  cancelAgreement,
  getAllAgreements,
  getMyAgreements,
  getAgreementById,
  getAgreementsByProfileId,
};