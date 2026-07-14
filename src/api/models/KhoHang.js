const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const KhoHang = sequelize.define(
  "KhoHang",
  {
    id_kho_hang: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    ten_kho: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    id_diem_xuat_phat: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    dia_chi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    vi_do: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    kinh_do: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true,
    },
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    trang_thai: {
      type: DataTypes.ENUM("hoat_dong", "tam_ngung"),
      defaultValue: "hoat_dong",
    },
  },
  {
    tableName: "kho_hang",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
  }
);

module.exports = KhoHang;
