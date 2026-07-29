const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const DonHang = sequelize.define("DonHang", {
  id_don_hang: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_nguoi_dung: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_vu_nuoi: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  id_ho_so: {
  type: DataTypes.BIGINT,
  allowNull: true,
},
  tong_tien: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  phi_van_chuyen: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  tong_thanh_toan: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  ty_le_phu_phi_tra_sau: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  lai_suat_qua_han_thang: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
  },
  id_khu_vuc_giao_hang: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  id_diem_xuat_phat: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  id_kho_xuat: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  co_chuyen_kho: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  khoang_cach_giao_hang_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  vi_do_giao_hang: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  kinh_do_giao_hang: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
  },
  hinh_thuc_thanh_toan: {
    type: DataTypes.ENUM("cod", "chuyen_khoan", "tra_sau"),
    allowNull: false,
  },
  trang_thai_don_hang: {
    type: DataTypes.ENUM(
      "cho_xu_ly",
      "cho_thanh_toan",
      "da_thanh_toan",
      "cho_giao",
      "dang_giao",
      "hoan_tat",
      "giao_that_bai",
      "da_huy"
    ),
    defaultValue: "cho_xu_ly",
  },
  dia_chi_giao_hang: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
  ngay_dat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ngay_duyet: {
    type: DataTypes.DATE,
  },
  ngay_giao: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "don_hang",
  timestamps: false,
});

module.exports = DonHang;
