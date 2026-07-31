const { sequelize } = require("../../config/database");

const {
  phieuDeXuatHanMucRepository,
  customerProfileRepository,
  chinhSachHanMucRepository,
} = require("../repositories");

const notificationService = require("./notification.service");

// Chuyển giá trị thành số, nếu không có thì bằng 0
const toNumber = (value) => Number(value || 0);

// Cho phép lập phiếu sớm tối đa 3 ngày
const MAX_DAYS_BEFORE_POLICY_STAGE = 3;

// Kiểm tra người dùng có quyền lập phiếu đề xuất không
const canCreateProposal = (role) => {
  return role === "nhan_vien_dinh_muc" || role === "admin";
};

// Tính số ngày giữa hai mốc thời gian
const getDayDiff = (fromDate, toDate) => {
  if (!fromDate || !toDate) return null;

  const start = new Date(fromDate);
  const end = new Date(toDate);

  // Ngày không hợp lệ thì trả về null
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return null;
  }

  const diffMs = end.getTime() - start.getTime();

  // Đổi mili giây thành ngày
  return Math.max(
    Math.floor(diffMs / (1000 * 60 * 60 * 24)),
    0
  );
};

// Tìm chính sách phù hợp với số ngày nuôi hiện tại
const findPolicyByFarmingDay = async (ngayNuoi) => {
  if (ngayNuoi === null || ngayNuoi === undefined) {
    return null;
  }

  // Lấy các chính sách đang hoạt động
  const activePolicies =
    await chinhSachHanMucRepository.findActive();

  // Tìm chính sách có khoảng ngày phù hợp
  return (
    activePolicies.find(
      (policy) =>
        Number(ngayNuoi) >= Number(policy.tu_ngay) &&
        Number(ngayNuoi) <= Number(policy.den_ngay)
    ) || null
  );
};

// Tìm chính sách của giai đoạn tiếp theo
const findNextPolicyForApprovedProfile = async (
  profile,
  farmingDays
) => {
  if (farmingDays === null || farmingDays === undefined) {
    return null;
  }

  // Chuyển dữ liệu Sequelize thành object thông thường
  const plainProfile = profile.toJSON
    ? profile.toJSON()
    : profile;

  const currentPolicy = plainProfile.ChinhSachHanMuc;

  if (!currentPolicy) return null;

  const activePolicies =
    await chinhSachHanMucRepository.findActive();

  return (
    activePolicies
      .filter((policy) => {
        // Số ngày còn lại trước khi bước sang giai đoạn mới
        const daysUntilStage =
          Number(policy.tu_ngay) - Number(farmingDays);

        return (
          // Phải cùng tên chính sách
          String(policy.ten_chinh_sach || "").trim() ===
            String(
              currentPolicy.ten_chinh_sach || ""
            ).trim() &&

          // Phải là giai đoạn sau
          Number(policy.tu_ngay) >
            Number(currentPolicy.tu_ngay) &&

          // Chỉ được lập sớm tối đa 3 ngày
          daysUntilStage <= MAX_DAYS_BEFORE_POLICY_STAGE
        );
      })

      // Ưu tiên giai đoạn gần nhất
      .sort(
        (a, b) =>
          Number(a.tu_ngay) - Number(b.tu_ngay)
      )[0] || null
  );
};

// Kiểm tra chính sách được chọn có đúng quy trình nâng hạn mức không
const validatePolicyUpgradeFlow = (
  profile,
  selectedPolicy
) => {
  if (!selectedPolicy) return;

  const plainProfile = profile.toJSON
    ? profile.toJSON()
    : profile;

  const currentPolicy = plainProfile.ChinhSachHanMuc;

  if (!currentPolicy) return;

  // Chính sách mới phải cùng bộ với chính sách hiện tại
  if (
    String(selectedPolicy.ten_chinh_sach || "").trim() !==
    String(currentPolicy.ten_chinh_sach || "").trim()
  ) {
    throw new Error(
      "Chỉ được đề xuất nâng hạn mức trong cùng bộ chính sách hiện tại của hồ sơ"
    );
  }

  // Chính sách mới phải thuộc giai đoạn sau
  if (
    Number(selectedPolicy.tu_ngay) <=
    Number(currentPolicy.tu_ngay)
  ) {
    throw new Error(
      "Chính sách đề xuất phải là giai đoạn sau giai đoạn hiện tại"
    );
  }

  // Hạn mức mới phải cao hơn hạn mức hiện tại
  if (
    toNumber(selectedPolicy.han_muc_toi_da) <=
    toNumber(currentPolicy.han_muc_toi_da)
  ) {
    throw new Error(
      "Hạn mức của giai đoạn đề xuất phải cao hơn hạn mức hiện tại"
    );
  }
};

// Kiểm tra đã đến thời điểm lập phiếu cho giai đoạn mới chưa
const validatePolicyTiming = (
  profile,
  selectedPolicy,
  farmingDays
) => {
  if (
    !selectedPolicy ||
    farmingDays === null ||
    farmingDays === undefined
  ) {
    return;
  }

  const plainProfile = profile.toJSON
    ? profile.toJSON()
    : profile;

  const currentPolicy = plainProfile.ChinhSachHanMuc;

  if (!currentPolicy) return;

  // Kiểm tra chính sách có phải giai đoạn tiếp theo không
  const isNextStageInSameSet =
    String(selectedPolicy.ten_chinh_sach || "").trim() ===
      String(currentPolicy.ten_chinh_sach || "").trim() &&
    Number(selectedPolicy.tu_ngay) >
      Number(currentPolicy.tu_ngay);

  if (!isNextStageInSameSet) return;

  const daysUntilStage =
    Number(selectedPolicy.tu_ngay) - Number(farmingDays);

  // Không cho lập phiếu quá sớm
  if (daysUntilStage > MAX_DAYS_BEFORE_POLICY_STAGE) {
    throw new Error(
      `Chưa đến thời điểm lập phiếu cho giai đoạn này. ` +
        `Chỉ được lập sớm tối đa ${MAX_DAYS_BEFORE_POLICY_STAGE} ` +
        `ngày trước mốc ${selectedPolicy.tu_ngay} ngày nuôi`
    );
  }
};

// Lấy đường dẫn của file đã tải lên
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

// Chuẩn hóa danh sách ảnh khảo sát thành chuỗi JSON
const normalizeSurveyImages = (
  files = [],
  bodyImages = null
) => {
  // Lấy đường dẫn từ các file mới tải lên
  const uploadedImages = Array.isArray(files)
    ? files.map(getUploadedFileUrl).filter(Boolean)
    : [];

  // Ưu tiên sử dụng file mới tải lên
  if (uploadedImages.length > 0) {
    return JSON.stringify(uploadedImages);
  }

  if (!bodyImages) return null;

  // Nếu dữ liệu là mảng
  if (Array.isArray(bodyImages)) {
    return JSON.stringify(bodyImages.filter(Boolean));
  }

  // Nếu dữ liệu là chuỗi
  if (typeof bodyImages === "string") {
    const trimmed = bodyImages.trim();

    if (!trimmed) return null;

    try {
      // Thử chuyển chuỗi JSON thành mảng
      const parsed = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.filter(Boolean));
      }
    } catch (_) {
      // Không phải JSON thì giữ nguyên chuỗi
      return trimmed;
    }

    return trimmed;
  }

  return null;
};

// Kiểm tra dữ liệu trước khi tạo phiếu đề xuất
const validateCreateProposal = async (
  user,
  data,
  transaction = null
) => {
  // Kiểm tra quyền lập phiếu
  if (!canCreateProposal(user.vai_tro)) {
    throw new Error(
      "Chỉ nhân viên định mức hoặc Admin mới được lập phiếu đề xuất"
    );
  }

  // Phải chọn hồ sơ
  if (!data.id_ho_so) {
    throw new Error("Vui lòng chọn hồ sơ mua trả sau");
  }

  // Hạn mức phải lớn hơn 0
  if (
    !data.han_muc_de_xuat ||
    toNumber(data.han_muc_de_xuat) <= 0
  ) {
    throw new Error("Hạn mức đề xuất phải lớn hơn 0");
  }

  // Phải có lý do đề xuất
  if (
    !data.ly_do_de_xuat ||
    !data.ly_do_de_xuat.trim()
  ) {
    throw new Error(
      "Vui lòng nhập lý do đề xuất hạn mức"
    );
  }

  // Tìm hồ sơ mua trả sau
  const profile =
    await customerProfileRepository.findById(
      data.id_ho_so,
      transaction
    );

  if (!profile) {
    throw new Error("Không tìm thấy hồ sơ mua trả sau");
  }

  // Hồ sơ bị từ chối không được lập phiếu
 if (profile.trang_thai_ho_so === "tu_choi") {
    throw new Error(
      "Hồ sơ đã bị từ chối, không thể lập phiếu đề xuất"
    );
  }

  // Hồ sơ đã duyệt có thể lập phiếu nâng hạn mức
  if (
    profile.duoc_phep_tra_sau &&
    profile.trang_thai_ho_so === "da_duyet"
  ) {
    return profile;
  }

  // Các trạng thái được phép lập phiếu
  const validStatus = [
    "cho_de_xuat",
    "cho_kiem_tra",
    "cho_admin_duyet",
  ];

  if (!validStatus.includes(profile.trang_thai_ho_so)) {
    throw new Error(
      "Trạng thái hồ sơ hiện tại chưa phù hợp để lập phiếu đề xuất"
    );
  }

  return profile;
};

// Tạo phiếu đề xuất hạn mức
const createProposal = async (user, data, files = []) => {
  // Mở transaction để đảm bảo dữ liệu đồng bộ
  const transaction = await sequelize.transaction();

  try {
    // Kiểm tra dữ liệu và lấy hồ sơ
    const profile = await validateCreateProposal(
      user,
      data,
      transaction
    );

    // Kiểm tra hồ sơ có phiếu đang chờ duyệt không
    const pending =
      await phieuDeXuatHanMucRepository
        .findPendingByProfileId(
          data.id_ho_so,
          transaction
        );

    if (pending) {
      throw new Error(
        "Hồ sơ này đang có phiếu đề xuất chờ Admin duyệt"
      );
    }

    const plainProfile = profile.toJSON
      ? profile.toJSON()
      : profile;

    // Lấy ngày khảo sát, mặc định là ngày hiện tại
    const ngayKhaoSat = data.ngay_khao_sat
      ? new Date(data.ngay_khao_sat)
      : new Date();

    if (Number.isNaN(ngayKhaoSat.getTime())) {
      throw new Error("Ngày khảo sát không hợp lệ");
    }

    // Lấy ngày bắt đầu nuôi
    const ngayThaGiong =
      plainProfile.VuNuoi?.ngay_tha_giong ||
      plainProfile.VuNuoi?.ngay_bat_dau ||
      null;

    // Tính số ngày nuôi tại thời điểm khảo sát
    const ngayNuoiLucKhaoSat = getDayDiff(
      ngayThaGiong,
      ngayKhaoSat
    );

    let policy = null;

    // Nếu người dùng chọn chính sách
    if (data.id_chinh_sach) {
      policy =
        await chinhSachHanMucRepository.findById(
          data.id_chinh_sach
        );

      if (!policy) {
        throw new Error(
          "Không tìm thấy chính sách hạn mức"
        );
      }

      if (policy.trang_thai !== "hoat_dong") {
        throw new Error(
          "Chính sách hạn mức đã tạm dừng"
        );
      }
    } else {
      // Tự tìm chính sách theo giai đoạn nuôi
      policy =
        (
          profile.duoc_phep_tra_sau &&
          profile.trang_thai_ho_so === "da_duyet"
            ? await findNextPolicyForApprovedProfile(
                profile,
                ngayNuoiLucKhaoSat
              )
            : null
        ) ||
        (await findPolicyByFarmingDay(
          ngayNuoiLucKhaoSat
        ));
    }

    // Kiểm tra quy trình nâng hạn mức
    validatePolicyUpgradeFlow(profile, policy);

    // Kiểm tra thời điểm lập phiếu
    validatePolicyTiming(
      profile,
      policy,
      ngayNuoiLucKhaoSat
    );

    // Hạn mức đề xuất không được vượt chính sách
    if (
      policy &&
      toNumber(data.han_muc_de_xuat) >
        toNumber(policy.han_muc_toi_da)
    ) {
      throw new Error(
        `Hạn mức đề xuất không được vượt quá hạn mức tối đa của chính sách: ${toNumber(
          policy.han_muc_toi_da
        ).toLocaleString()}đ`
      );
    }

    // Xác định chính sách được áp dụng
    const selectedPolicyId =
      policy?.id_chinh_sach ||
      data.id_chinh_sach ||
      profile.id_chinh_sach ||
      null;

    // Chuẩn hóa ảnh khảo sát
    const surveyImages = normalizeSurveyImages(
      files,
      data.hinh_anh_khao_sat
    );

    // Tạo phiếu đề xuất
    const proposal =
      await phieuDeXuatHanMucRepository.create(
        {
          id_ho_so: data.id_ho_so,
          id_nhan_vien_de_xuat:
            user.id_nguoi_dung,
          id_admin_duyet: null,

          id_chinh_sach: selectedPolicyId,
          ngay_khao_sat: ngayKhaoSat,
          ngay_nuoi_luc_khao_sat:
            ngayNuoiLucKhaoSat,

          han_muc_hien_tai: toNumber(
            profile.dinh_muc_cong_no
          ),
          han_muc_de_xuat: toNumber(
            data.han_muc_de_xuat
          ),
          han_muc_duoc_duyet: null,

          ly_do_de_xuat:
            data.ly_do_de_xuat.trim(),
          nhan_xet_khao_sat:
            data.nhan_xet_khao_sat || null,

          hinh_anh_khao_sat: surveyImages,

          trang_thai: "cho_duyet",
          ly_do_tu_choi: null,
          ngay_de_xuat: new Date(),
          ngay_duyet: null,
        },
        transaction
      );

    // Chuyển hồ sơ sang chờ Admin duyệt
    await customerProfileRepository.update(
      data.id_ho_so,
      {
        id_chinh_sach: selectedPolicyId,
        trang_thai_ho_so: "cho_admin_duyet",
      },
      transaction
    );

    // Thông báo cho khách hàng
    await notificationService.createNotification({
      id_nguoi_dung: profile.id_nguoi_dung,
      tieu_de: "Hồ sơ đã được đề xuất hạn mức",
      noi_dung:
        "Hồ sơ mua trả sau của bạn đã được chuyển đến Admin để xem xét.",
      loai: "cong_no",
      lien_ket:
        `/customer-profile/${profile.id_ho_so}`,
      transaction,
    });

    // Lưu toàn bộ thay đổi
    await transaction.commit();

    return await phieuDeXuatHanMucRepository.findById(
      proposal.id_phieu_de_xuat
    );
  } catch (error) {
    // Có lỗi thì hoàn tác toàn bộ thay đổi
    await transaction.rollback();
    throw error;
  }
};

// Lấy tất cả phiếu đề xuất
const getAllProposals = async (user) => {
  // Chỉ Admin và nhân viên định mức được xem
  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc"
  ) {
    throw new Error(
      "Bạn không có quyền xem danh sách phiếu đề xuất"
    );
  }

  return await phieuDeXuatHanMucRepository.findAll();
};

// Lấy chi tiết một phiếu đề xuất
const getProposalById = async (
  user,
  id_phieu_de_xuat
) => {
  const proposal =
    await phieuDeXuatHanMucRepository.findById(
      id_phieu_de_xuat
    );

  if (!proposal) {
    throw new Error(
      "Không tìm thấy phiếu đề xuất hạn mức"
    );
  }

  const plain = proposal.toJSON
    ? proposal.toJSON()
    : proposal;

  // Admin và nhân viên định mức được xem mọi phiếu
  // Khách hàng chỉ được xem phiếu của mình
  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(plain.HoSoKhachHang?.id_nguoi_dung) !==
      Number(user.id_nguoi_dung)
  ) {
    throw new Error(
      "Bạn không có quyền xem phiếu đề xuất này"
    );
  }

  return proposal;
};

// Lấy các phiếu đề xuất của một hồ sơ
const getProposalsByProfileId = async (
  user,
  id_ho_so
) => {
  const profile =
    await customerProfileRepository.findById(id_ho_so);

  if (!profile) {
    throw new Error(
      "Không tìm thấy hồ sơ mua trả sau"
    );
  }

  // Kiểm tra quyền xem hồ sơ
  if (
    user.vai_tro !== "admin" &&
    user.vai_tro !== "nhan_vien_dinh_muc" &&
    Number(profile.id_nguoi_dung) !==
      Number(user.id_nguoi_dung)
  ) {
    throw new Error(
      "Bạn không có quyền xem phiếu đề xuất của hồ sơ này"
    );
  }

  return await phieuDeXuatHanMucRepository
    .findByProfileId(id_ho_so);
};

// Admin duyệt phiếu đề xuất hạn mức
const approveProposal = async (
  user,
  id_phieu_de_xuat,
  data = {}
) => {
  // Chỉ Admin được duyệt
  if (user.vai_tro !== "admin") {
    throw new Error(
      "Chỉ Admin mới có quyền duyệt phiếu đề xuất hạn mức"
    );
  }

  const transaction = await sequelize.transaction();

  try {
    // Tìm phiếu đề xuất
    const proposal =
      await phieuDeXuatHanMucRepository.findById(
        id_phieu_de_xuat,
        transaction
      );

    if (!proposal) {
      throw new Error(
        "Không tìm thấy phiếu đề xuất hạn mức"
      );
    }

    // Phiếu phải đang chờ duyệt
    if (proposal.trang_thai !== "cho_duyet") {
      throw new Error(
        "Phiếu đề xuất này đã được xử lý"
      );
    }

    const profile = proposal.HoSoKhachHang;

    if (!profile) {
      throw new Error(
        "Không tìm thấy hồ sơ của phiếu đề xuất"
      );
    }

    // Nếu Admin không nhập thì dùng hạn mức được đề xuất
    const hanMucDuocDuyet = toNumber(
      data.han_muc_duoc_duyet ||
        proposal.han_muc_de_xuat
    );

    if (hanMucDuocDuyet <= 0) {
      throw new Error(
        "Hạn mức được duyệt phải lớn hơn 0"
      );
    }

    // Hồ sơ phải có hạn thanh toán
    if (
      !data.han_thanh_toan &&
      !profile.han_thanh_toan
    ) {
      throw new Error(
        "Vui lòng nhập hạn thanh toán cho hồ sơ"
      );
    }

    const chinhSach =
      proposal.ChinhSachHanMuc ||
      profile.ChinhSachHanMuc;

    // Hạn mức duyệt không được vượt chính sách
    if (
      chinhSach &&
      chinhSach.trang_thai === "hoat_dong" &&
      hanMucDuocDuyet >
        toNumber(chinhSach.han_muc_toi_da)
    ) {
      throw new Error(
        `Hạn mức được duyệt không được vượt quá chính sách: ${toNumber(
          chinhSach.han_muc_toi_da
        ).toLocaleString()}đ`
      );
    }

    // Cập nhật phiếu thành đã duyệt
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

    // Cấp quyền mua trả sau cho ly_do hồ sơ
    await customerProfileRepository.update(
      profile.id_ho_so,
      {
        id_chinh_sach:
          proposal.id_chinh_sach ||
          profile.id_chinh_sach ||
          null,
        dinh_muc_cong_no: hanMucDuocDuyet,
        duoc_phep_tra_sau: true,
        bi_khoa_tra_sau: false,
        ly_do_khoa: null,
        han_thanh_toan:
          data.han_thanh_toan ||
          profile.han_thanh_toan,
        ngay_duyet: new Date(),
        trang_thai_ho_so: "da_duyet",
        ly_do_tu_choi: null,
        ghi_chu:
          data.ghi_chu || profile.ghi_chu,
      },
      transaction
    );

    // Thông báo kết quả cho khách hàng
    await notificationService.createNotification({
      id_nguoi_dung: profile.id_nguoi_dung,
      tieu_de: "Hồ sơ mua trả sau được duyệt",
      noi_dung:
        `Hồ sơ của bạn đã được duyệt hạn mức ` +
        `${hanMucDuocDuyet.toLocaleString()}đ.`,
      loai: "cong_no",
      lien_ket:
        `/customer-profile/${profile.id_ho_so}`,
      transaction,
    });

    await transaction.commit();

    return await phieuDeXuatHanMucRepository.findById(
      id_phieu_de_xuat
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Admin từ chối phiếu đề xuất
const rejectProposal = async (
  user,
  id_phieu_de_xuat,
  data = {}
) => {
  // Chỉ Admin được từ chối
  if (user.vai_tro !== "admin") {
    throw new Error(
      "Chỉ Admin mới có quyền từ chối phiếu đề xuất hạn mức"
    );
  }

  // Bắt buộc nhập lý do từ chối
  if (
    !data.ly_do_tu_choi ||
    !data.ly_do_tu_choi.trim()
  ) {
    throw new Error("Vui lòng nhập lý do từ chối");
  }

  const transaction = await sequelize.transaction();

  try {
    // Tìm phiếu đề xuất
    const proposal =
      await phieuDeXuatHanMucRepository.findById(
        id_phieu_de_xuat,
        transaction
      );

    if (!proposal) {
      throw new Error(
        "Không tìm thấy phiếu đề xuất hạn mức"
      );
    }

    // Chỉ xử lý phiếu đang chờ duyệt
    if (proposal.trang_thai !== "cho_duyet") {
      throw new Error(
        "Phiếu đề xuất này đã được xử lý"
      );
    }

    const profile = proposal.HoSoKhachHang;

    if (!profile) {
      throw new Error(
        "Không tìm thấy hồ sơ của phiếu đề xuất"
      );
    }

    // Cập nhật phiếu thành từ chối
    await phieuDeXuatHanMucRepository.update(
      id_phieu_de_xuat,
      {
        id_admin_duyet: user.id_nguoi_dung,
        trang_thai: "tu_choi",
        ly_do_tu_choi:
          data.ly_do_tu_choi.trim(),
        ngay_duyet: new Date(),
      },
      transaction
    );

    // Cập nhật hồ sơ thành từ chối
    await customerProfileRepository.update(
      profile.id_ho_so,
      {
        duoc_phep_tra_sau: false,
        trang_thai_ho_so: "tu_choi",
        ly_do_tu_choi:
          data.ly_do_tu_choi.trim(),
      },
      transaction
    );

    // Thông báo lý do từ chối cho khách hàng
    await notificationService.createNotification({
      id_nguoi_dung: profile.id_nguoi_dung,
      tieu_de: "Hồ sơ mua trả sau bị từ chối",
      noi_dung:
        `Hồ sơ của bạn bị từ chối. Lý do: ` +
        `${data.ly_do_tu_choi}`,
      loai: "cong_no",
      lien_ket:
        `/customer-profile/${profile.id_ho_so}`,
      transaction,
    });

    await transaction.commit();

    return await phieuDeXuatHanMucRepository.findById(
      id_phieu_de_xuat
    );
  } catch (error) {
    // Có lỗi thì hoàn tác dữ liệu
    await transaction.rollback();
    throw error;
  }
};

// Xuất các hàm để controller sử dụng
module.exports = {
  createProposal,
  getAllProposals,
  getProposalById,
  getProposalsByProfileId,
  approveProposal,
  rejectProposal,
};