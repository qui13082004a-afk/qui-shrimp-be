const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");
const KhuVucHoTroTraSau = require("./KhuVucHoTroTraSau");
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
    ho_ten: { type: DataTypes.STRING(150), allowNull: false },
    ngay_sinh: { type: DataTypes.DATEONLY, allowNull: false },
    so_cccd: { type: DataTypes.STRING(20), allowNull: false },
    so_dien_thoai: { type: DataTypes.STRING(20), allowNull: false },
    zalo: { type: DataTypes.STRING(50), allowNull: true },
    dia_chi_thuong_tru: { type: DataTypes.TEXT, allowNull: false },

    // Địa chỉ ao được tách trường để kiểm tra vùng hỗ trợ ổn định
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
    so_vu_nuoi_moi_nam: { type: DataTypes.INTEGER, allowNull: false },
    san_luong_du_kien: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    don_vi_san_luong: {
      type: DataTypes.ENUM("kg", "tan"),
      allowNull: false,
      defaultValue: "kg",
    },
    kinh_nghiem_nuoi_nam: { type: DataTypes.INTEGER, allowNull: false },
    nguon_thu_nhap_tra_no: { type: DataTypes.TEXT, allowNull: false },
    nguoi_mua_tom_du_kien: { type: DataTypes.STRING(200), allowNull: true },
    ngay_thu_hoach_du_kien: { type: DataTypes.DATEONLY, allowNull: false },

    han_muc_mong_muon: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    thoi_han_tra_mong_muon: { type: DataTypes.INTEGER, allowNull: false },
    don_vi_thoi_han: {
      type: DataTypes.ENUM("ngay", "thang", "sau_thu_hoach"),
      allowNull: false,
    },
    mat_hang_du_kien: { type: DataTypes.TEXT, allowNull: false },

    nguoi_bao_lanh_ho_ten: { type: DataTypes.STRING(150), allowNull: true },
    nguoi_bao_lanh_sdt: { type: DataTypes.STRING(20), allowNull: true },
    nguoi_bao_lanh_cccd: { type: DataTypes.STRING(20), allowNull: true },
    nguoi_bao_lanh_quan_he: { type: DataTypes.STRING(100), allowNull: true },

    cam_ket_thong_tin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dong_y_xac_minh: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    dong_y_dieu_khoan: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

    anh_cccd_mat_truoc: { type: DataTypes.STRING(500), allowNull: false },
    anh_cccd_mat_sau: { type: DataTypes.STRING(500), allowNull: false },
    anh_selfie: { type: DataTypes.STRING(500), allowNull: false },
    anh_bien_lai_tha_giong: { type: DataTypes.STRING(500), allowNull: false },
    anh_ao_nuoi: { type: DataTypes.STRING(500), allowNull: true },

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
    ngay_duyet: { type: DataTypes.DATE, allowNull: true },
    ghi_chu: { type: DataTypes.TEXT, allowNull: true },
    do_tuong_dong: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
    trang_thai_xac_thuc: {
      type: DataTypes.ENUM("chua_xac_thuc", "da_xac_thuc", "that_bai"),
      defaultValue: "chua_xac_thuc",
    },
    ly_do_xac_thuc_that_bai: { type: DataTypes.TEXT, allowNull: true },
    ngay_xac_thuc: { type: DataTypes.DATE, allowNull: true },
    ngay_tao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  { tableName: "ho_so_khach_hang", timestamps: false }
);

module.exports = HoSoKhachHang;
