const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const NhanVienGiaoHang = sequelize.define("NhanVienGiaoHang", {
  id_nhan_vien_giao_hang: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_nguoi_dung: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  khu_vuc_phu_trach: {
    type: DataTypes.STRING(100),
  },
  ngay_bat_dau: {
    type: DataTypes.DATE,
  },
  trang_thai: {
    type: DataTypes.ENUM("dang_lam", "nghi"),
    defaultValue: "dang_lam",
  },
  ngay_lam_viec: {
    type: DataTypes.TEXT,
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "nhan_vien_giao_hang",
  timestamps: false,
});

module.exports = NhanVienGiaoHang;