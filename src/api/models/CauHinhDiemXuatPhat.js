const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const CauHinhDiemXuatPhat = sequelize.define("CauHinhDiemXuatPhat", {
  id_diem_xuat_phat: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  ten_diem: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  dia_chi: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  vi_do: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
  },
  kinh_do: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
  },
  ban_kinh_toi_da_km: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  dang_hoat_dong: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  la_mac_dinh: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: "cau_hinh_diem_xuat_phat",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
  indexes: [
    { fields: ["dang_hoat_dong"] },
    { fields: ["la_mac_dinh"] },
  ],
});

module.exports = CauHinhDiemXuatPhat;
