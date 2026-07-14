const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const DiaChiGiaoHang = sequelize.define(
  "DiaChiGiaoHang",
  {
    id_dia_chi: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    ten_nguoi_nhan: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    so_dien_thoai: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    dia_chi: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    id_tinh_thanh: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    id_phuong_xa: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    vi_do: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    kinh_do: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
    },
    la_mac_dinh: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dang_hoat_dong: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "dia_chi_giao_hang",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
    indexes: [
      { fields: ["id_nguoi_dung"] },
      { fields: ["id_tinh_thanh"] },
      { fields: ["id_phuong_xa"] },
      { fields: ["la_mac_dinh"] },
      { fields: ["dang_hoat_dong"] },
    ],
  }
);

module.exports = DiaChiGiaoHang;
