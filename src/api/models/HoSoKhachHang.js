const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");
const KhuVucHoTroTraSau = require("./KhuVucHoTroTraSau");
const { encryptText, decryptText } = require("../../helpers/encryption");

const encryptedField = (field, allowNull = true) => ({
  type: DataTypes.TEXT,
  allowNull,
  get() {
    return decryptText(this.getDataValue(field));
  },
  set(value) {
    this.setDataValue(field, encryptText(value));
  },
});

const HoSoKhachHang = sequelize.define(
  "HoSoKhachHang",
  {
    id_ho_so: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    id_nguoi_dung: { type: DataTypes.BIGINT, allowNull: false },
    id_chinh_sach: { type: DataTypes.BIGINT, allowNull: true },
    id_chinh_sach_da_nhac: { type: DataTypes.BIGINT, allowNull: true },
    id_ao: { type: DataTypes.BIGINT, allowNull: false },
    id_vu_nuoi: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    id_khu_vuc: { type: DataTypes.BIGINT, allowNull: false },
    // Thông tin cá nhân tại thời điểm nộp hồ sơ
    ho_ten: encryptedField("ho_ten", false),
    ngay_sinh: encryptedField("ngay_sinh", false),
    so_cccd: encryptedField("so_cccd", false),
    so_dien_thoai: encryptedField("so_dien_thoai", false),
    zalo: encryptedField("zalo"),
    dia_chi_thuong_tru: encryptedField("dia_chi_thuong_tru", false),
    tinh_thanh_ao: { type: DataTypes.STRING(100), allowNull: false },
    quan_huyen_ao: { type: DataTypes.STRING(100), allowNull: false },
    phuong_xa_ao: { type: DataTypes.STRING(100), allowNull: false },
    dia_chi_chi_tiet_ao: { type: DataTypes.TEXT, allowNull: true },
    dien_tich_ao: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    don_vi_dien_tich: {
      type: DataTypes.ENUM("m2", "ha"),
      allowNull: false,
      defaultValue: "m2",
    },
    ngay_thu_hoach_du_kien: { type: DataTypes.DATEONLY, allowNull: false },
    han_muc_mong_muon: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    thoi_han_tra_mong_muon: { type: DataTypes.INTEGER, allowNull: false },
    don_vi_thoi_han: {
      type: DataTypes.ENUM("ngay", "thang", "sau_thu_hoach"),
      allowNull: false,
    },
    nguoi_bao_lanh_ho_ten: encryptedField("nguoi_bao_lanh_ho_ten"),
    nguoi_bao_lanh_sdt: encryptedField("nguoi_bao_lanh_sdt"),
    nguoi_bao_lanh_cccd: encryptedField("nguoi_bao_lanh_cccd"),
    nguoi_bao_lanh_quan_he: encryptedField("nguoi_bao_lanh_quan_he"),
    cam_ket_thong_tin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dong_y_xac_minh: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dong_y_dieu_khoan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    anh_cccd_mat_truoc: { type: DataTypes.STRING(500), allowNull: false },
    anh_cccd_mat_sau: { type: DataTypes.STRING(500), allowNull: false },
    anh_bien_lai_tha_giong: { type: DataTypes.STRING(500), allowNull: false },
    anh_ao_nuoi: { type: DataTypes.TEXT, allowNull: true },
    dinh_muc_cong_no: { type: DataTypes.DECIMAL(15, 2), allowNull: false, defaultValue: 0 },
    trang_thai_ho_so: {
      type: DataTypes.ENUM("cho_kiem_tra", "cho_de_xuat", "cho_admin_duyet", "da_duyet", "tu_choi"),
      defaultValue: "cho_kiem_tra",
    },
    ly_do_tu_choi: { type: DataTypes.TEXT, allowNull: true },
    bi_khoa_tra_sau: { type: DataTypes.BOOLEAN, defaultValue: false },
    ly_do_khoa: { type: DataTypes.TEXT, allowNull: true },
    duoc_phep_tra_sau: { type: DataTypes.BOOLEAN, defaultValue: false },
    han_thanh_toan: { type: DataTypes.DATE, allowNull: true },
    ngay_nhac_no_qua_han: { type: DataTypes.DATEONLY, allowNull: true },
    ngay_duyet: { type: DataTypes.DATE, allowNull: true },
    ghi_chu: { type: DataTypes.TEXT, allowNull: true },
    ngay_tao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "ho_so_khach_hang", timestamps: false }
);

module.exports = HoSoKhachHang;
