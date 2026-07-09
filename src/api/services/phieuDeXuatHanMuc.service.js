const { sequelize } = require("../../config/database");
const {
  phieuDeXuatHanMucRepository,
  customerProfileRepository,
  chinhSachHanMucRepository,
} = require("../repositories");

const notificationService = require("./notification.service");

const toNumber = (value) => Number(value || 0);

const canCreateProposal = (role) => {
  return role === "nhan_vien_dinh_muc" || role === "admin";
};

const getDayDiff = (fromDate, toDate) => {
  if (!fromDate || !toDate) return null;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();
  return Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)), 0);
};

const findPolicyByFarmingDay = async (ngayNuoi) => {
  if (ngayNuoi === null || ngayNuoi === undefined) return null;

  const activePolicies = await chinhSachHanMucRepository.findActive();

  return (
    activePolicies.find(
      (policy) =>
        Number(ngayNuoi) >= Number(policy.tu_ngay) &&
        Number(ngayNuoi) <= Number(policy.den_ngay)
    ) || null
  );
};

const getUploadedFileUrl = (file) => {
  return (
    file?.path ||
    file?.secure_url ||
    file?.url ||
    file?.location ||
    file?.filename ||
    null
  );
};

const normalizeSurveyImages = (files = [], bodyImages = null) => {
  const uploadedImages = Array.isArray(files)
    ? files.map(getUploadedFileUrl).filter(Boolean)
    : [];

  if (uploadedImages.length > 0) {
    return JSON.stringify(uploadedImages);
  }

  if (!bodyImages) return null;

  if (Array.isArray(bodyImages)) {
    return JSON.stringify(bodyImages.filter(Boolean));
  }

  if (typeof bodyImages === "string") {
    const trimmed = bodyImages.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.filter(Boolean));
      }
    } catch (_) {
      return trimmed;
    }

    return trimmed;
  }

  return null;
};

const validateCreateProposal = async (user, data, transaction = null) => {
  if (!canCreateProposal(user.vai_tro)) {
    throw new Error("Chỉ nhân viên định mức hoặc Admin mới được lập phiếu đề xuất");
  }

  if (!data.id_ho_so) {
    throw new Error("Vui lòng chọn hồ sơ mua trả sau");
  }

  if (!data.han_muc_de_xuat || toNumber(data.han_muc_de_xuat) <= 0) {
    throw new Error("Hạn mức đề xuất phải lớn hơn 0");
  }

  if (!data.ly_do_de_xuat || !data.ly_do_de_xuat.trim()) {
    throw new Error("Vui lòng nhập lý do đề xuất hạn mức");
  }

  const profile = await customerProfileRepository.findById(
    data.id_ho_so,
    transaction
  );

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ mua trả sau");
  }

  if (profile.trang_thai_ho_so === "tu_choi") {
    throw new Error("Hồ sơ đã bị từ chối, không thể lập phiếu đề xuất");
  }

  if (profile.duoc_phep_tra_sau && profile.trang_thai_ho_so === "da_duyet") {
    return profile;
  }

  const validStatus = ["cho_de_xuat", "cho_kiem_tra", "cho_admin_duyet"];

  if (!validStatus.includes(profile.trang_thai_ho_so)) {
    throw new Error("Trạng thái hồ sơ hiện tại chưa phù hợp để lập phiếu đề xuất");
  }

  return profile;
};

const createProposal = async (user, data, files = []) => {
  const transaction = await sequelize.transaction();

  try {
    const profile = await validateCreateProposal(user, data, transaction);

    const pending = await phieuDeXuatHanMucRepository.findPendingByProfileId(
      data.id_ho_so,
      transaction
    );

    if (pending) {
      throw new Error("Hồ sơ này đang có phiếu đề xuất chờ Admin duyệt");
    }

    const plainProfile = profile.toJSON ? profile.toJSON() : profile;

    const ngayKhaoSat = data.ngay_khao_sat
      ? new Date(data.ngay_khao_sat)
      : new Date();

    if (Number.isNaN(ngayKhaoSat.getTime())) {
      throw new Error("Ngày khảo sát không hợp lệ");
    }

    const ngayThaGiong =
      plainProfile.VuNuoi?.ngay_tha_giong ||
      plainProfile.VuNuoi?.ngay_bat_dau ||
      null;

    const ngayNuoiLucKhaoSat = getDayDiff(ngayThaGiong, ngayKhaoSat);

    let policy = null;

    if (data.id_chinh_sach) {
      policy = await chinhSachHanMucRepository.findById(data.id_chinh_sach);

      if (!policy) {
        throw new Error("Không tìm thấy chính sách hạn mức");
      }

      if (policy.trang_thai !== "hoat_dong") {
        throw new Error("Chính sách hạn mức đã tạm dừng");
      }
    } else {
      policy = await findPolicyByFarmingDay(ngayNuoiLucKhaoSat);
    }

    if (
      policy &&
      toNumber(data.han_muc_de_xuat) > toNumber(policy.han_muc_toi_da)
    ) {
      throw new Error(
        `Hạn mức đề xuất không được vượt quá hạn mức tối đa của chính sách: ${toNumber(
          policy.han_muc_toi_da
        ).toLocaleString()}đ`
      );
    }

    const selectedPolicyId =
      policy?.id_chinh_sach ||
      data.id_chinh_sach ||
      profile.id_chinh_sach ||
      null;

    const surveyImages = normalizeSurveyImages(files, data.hinh_anh_khao_sat);

    const proposal = await phieuDeXuatHanMucRepository.create(
      {
        id_ho_so: data.id_ho_so,
        id_nhan_vien_de_xuat: user.id_nguoi_dung,
        id_admin_duyet: null,

        id_chinh_sach: selectedPolicyId,
        ngay_khao_sat: ngayKhaoSat,
        ngay_nuoi_luc_khao_sat: ngayNuoiLucKhaoSat,

        han_muc_hien_tai: toNumber(profile.dinh_muc_cong_no),
        han_muc_de_xuat: toNumber(data.han_muc_de_xuat),
        han_muc_duoc_duyet: null,

        ly_do_de_xuat: data.ly_do_de_xuat.trim(),
        nhan_xet_khao_sat: data.nhan_xet_khao_sat || null,

        ph: data.ph || null,
        oxy_hoa_tan: data.oxy_hoa_tan || null,
        kich_co_tom: data.kich_co_tom || null,
        hinh_anh_khao_sat: surveyImages,

        trang_thai: "cho_duyet",
        ly_do_tu_choi: null,
        ngay_de_xuat: new Date(),
        ngay_duyet: null,
      },
      transaction
    );

    await customerProfileRepository.update(
      data.id_ho_so,
      {
        id_chinh_sach: selectedPolicyId,
        trang_thai_ho_so: "cho_admin_duyet",
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: profile.id_nguoi_dung,
      tieu_de: "Hồ sơ đã được đề xuất hạn mức",
      noi_dung: "Hồ sơ mua trả sau của bạn đã được chuyển đến Admin để xem xét.",
      loai: "cong_no",
      lien_ket: `/customer-profile/${profile.id_ho_so}`,
      transaction,
    });

    await transaction.commit();

    return await phieuDeXuatHanMucRepository.findById(
      proposal.id_phieu_de_xuat
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const getAllProposals = async (user) => {
  if (user.vai_tro !== "admin" && user.vai_tro !== "nhan_vien_dinh_muc") {
    throw new Error("Bạn không có quyền xem danh sách phiếu đề xuất");
  }

  return await phieuDeXuatHanMucRepository.findAll();
};

const getProposalById = async (user, id_phieu_de_xuat) => {
  const proposal = await phieuDeXuatHanMucRepository.findById(id_phieu_de_xuat);

  if (!proposal) {
    throw new Error("Không tìm thấy phiếu đề xuất hạn mức");
  }

  const plain = proposal.toJSON ? proposal.toJSON() : proposal;

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(plain.HoSoKhachHang?.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem phiếu đề xuất này");
  }

  return proposal;
};

const getProposalsByProfileId = async (user, id_ho_so) => {
  const profile = await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ mua trả sau");
  }

  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(profile.id_nguoi_dung) !== Number(user.id_nguoi_dung)
  ) {
    throw new Error("Bạn không có quyền xem phiếu đề xuất của hồ sơ này");
  }

  return await phieuDeXuatHanMucRepository.findByProfileId(id_ho_so);
};

const approveProposal = async (user, id_phieu_de_xuat, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền duyệt phiếu đề xuất hạn mức");
  }

  const transaction = await sequelize.transaction();

  try {
    const proposal = await phieuDeXuatHanMucRepository.findById(
      id_phieu_de_xuat,
      transaction
    );

    if (!proposal) {
      throw new Error("Không tìm thấy phiếu đề xuất hạn mức");
    }

    if (proposal.trang_thai !== "cho_duyet") {
      throw new Error("Phiếu đề xuất này đã được xử lý");
    }

    const profile = proposal.HoSoKhachHang;

    if (!profile) {
      throw new Error("Không tìm thấy hồ sơ của phiếu đề xuất");
    }

    const hanMucDuocDuyet = toNumber(
      data.han_muc_duoc_duyet || proposal.han_muc_de_xuat
    );

    if (hanMucDuocDuyet <= 0) {
      throw new Error("Hạn mức được duyệt phải lớn hơn 0");
    }

    if (!data.han_thanh_toan && !profile.han_thanh_toan) {
      throw new Error("Vui lòng nhập hạn thanh toán cho hồ sơ");
    }

    const chinhSach = proposal.ChinhSachHanMuc || profile.ChinhSachHanMuc;

    if (
      chinhSach &&
      chinhSach.trang_thai === "hoat_dong" &&
      hanMucDuocDuyet > toNumber(chinhSach.han_muc_toi_da)
    ) {
      throw new Error(
        `Hạn mức được duyệt không được vượt quá chính sách: ${toNumber(
          chinhSach.han_muc_toi_da
        ).toLocaleString()}đ`
      );
    }

    await phieuDeXuatHanMucRepository.update(
      id_phieu_de_xuat,
      {
        id_admin_duyet: user.id_nguoi_dung,
        han_muc_duoc_duyet: hanMucDuocDuyet,
        trang_thai: "da_duyet",
        ngay_duyet: new Date(),
        ly_do_tu_choi: null,
      },
      transaction
    );

    await customerProfileRepository.update(
      profile.id_ho_so,
      {
        id_chinh_sach: proposal.id_chinh_sach || profile.id_chinh_sach || null,
        dinh_muc_cong_no: hanMucDuocDuyet,
        duoc_phep_tra_sau: true,
        bi_khoa_tra_sau: false,
        ly_do_khoa: null,
        han_thanh_toan: data.han_thanh_toan || profile.han_thanh_toan,
        ngay_duyet: new Date(),
        trang_thai_ho_so: "da_duyet",
        ly_do_tu_choi: null,
        ghi_chu: data.ghi_chu || profile.ghi_chu,
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: profile.id_nguoi_dung,
      tieu_de: "Hồ sơ mua trả sau được duyệt",
      noi_dung: `Hồ sơ của bạn đã được duyệt hạn mức ${hanMucDuocDuyet.toLocaleString()}đ.`,
      loai: "cong_no",
      lien_ket: `/customer-profile/${profile.id_ho_so}`,
      transaction,
    });

    await transaction.commit();

    return await phieuDeXuatHanMucRepository.findById(id_phieu_de_xuat);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const rejectProposal = async (user, id_phieu_de_xuat, data = {}) => {
  if (user.vai_tro !== "admin") {
    throw new Error("Chỉ Admin mới có quyền từ chối phiếu đề xuất hạn mức");
  }

  if (!data.ly_do_tu_choi || !data.ly_do_tu_choi.trim()) {
    throw new Error("Vui lòng nhập lý do từ chối");
  }

  const transaction = await sequelize.transaction();

  try {
    const proposal = await phieuDeXuatHanMucRepository.findById(
      id_phieu_de_xuat,
      transaction
    );

    if (!proposal) {
      throw new Error("Không tìm thấy phiếu đề xuất hạn mức");
    }

    if (proposal.trang_thai !== "cho_duyet") {
      throw new Error("Phiếu đề xuất này đã được xử lý");
    }

    const profile = proposal.HoSoKhachHang;

    if (!profile) {
      throw new Error("Không tìm thấy hồ sơ của phiếu đề xuất");
    }

    await phieuDeXuatHanMucRepository.update(
      id_phieu_de_xuat,
      {
        id_admin_duyet: user.id_nguoi_dung,
        trang_thai: "tu_choi",
        ly_do_tu_choi: data.ly_do_tu_choi.trim(),
        ngay_duyet: new Date(),
      },
      transaction
    );

    await customerProfileRepository.update(
      profile.id_ho_so,
      {
        duoc_phep_tra_sau: false,
        trang_thai_ho_so: "tu_choi",
        ly_do_tu_choi: data.ly_do_tu_choi.trim(),
      },
      transaction
    );

    await notificationService.createNotification({
      id_nguoi_dung: profile.id_nguoi_dung,
      tieu_de: "Hồ sơ mua trả sau bị từ chối",
      noi_dung: `Hồ sơ của bạn bị từ chối. Lý do: ${data.ly_do_tu_choi}`,
      loai: "cong_no",
      lien_ket: `/customer-profile/${profile.id_ho_so}`,
      transaction,
    });

    await transaction.commit();

    return await phieuDeXuatHanMucRepository.findById(id_phieu_de_xuat);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createProposal,
  getAllProposals,
  getProposalById,
  getProposalsByProfileId,
  approveProposal,
  rejectProposal,
};