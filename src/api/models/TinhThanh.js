const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const TinhThanh = sequelize.define("TinhThanh", {
  id_tinh_thanh: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  ma_tinh: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  ten_tinh: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: "tinh_thanh",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
  indexes: [
    { unique: true, fields: ["ma_tinh"] },
    { fields: ["ten_tinh"] },
  ],
});

module.exports = TinhThanh;
