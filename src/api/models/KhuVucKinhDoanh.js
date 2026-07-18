const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const KhuVucKinhDoanh = sequelize.define("KhuVucKinhDoanh", {
  id_khu_vuc: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_tinh_thanh: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
  },
  cho_phep_ban_hang: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  dang_hoat_dong: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  ban_kinh_toi_da_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  phi_van_chuyen_mac_dinh: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  },
  ghi_chu: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "khu_vuc_kinh_doanh",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
  indexes: [
    { unique: true, fields: ["id_tinh_thanh"] },
    { fields: ["dang_hoat_dong", "cho_phep_ban_hang"] },
  ],
});

module.exports = KhuVucKinhDoanh;
