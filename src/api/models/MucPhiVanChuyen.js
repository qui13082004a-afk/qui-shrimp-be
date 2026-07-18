const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const MucPhiVanChuyen = sequelize.define("MucPhiVanChuyen", {
  id_muc_phi: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_khu_vuc: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  tu_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  den_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  phi_co_dinh: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  dang_hoat_dong: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: "muc_phi_van_chuyen",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
  indexes: [
    { fields: ["id_khu_vuc"] },
    { fields: ["id_khu_vuc", "dang_hoat_dong"] },
    { fields: ["id_khu_vuc", "tu_km", "den_km"] },
  ],
});

module.exports = MucPhiVanChuyen;
