const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const AoNuoi = sequelize.define("AoNuoi", {
  id_ao: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_nguoi_dung: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  ten_ao: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  dien_tich: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  dia_chi_ao: {
    type: DataTypes.TEXT,
  },
  loai_hinh_nuoi: {
    type: DataTypes.STRING(100),
  },
  trang_thai_ao: {
    type: DataTypes.ENUM("dang_hoat_dong", "tam_ngung"),
    defaultValue: "dang_hoat_dong",
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "ao_nuoi",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: false,
});

module.exports = AoNuoi;