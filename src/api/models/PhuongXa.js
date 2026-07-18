const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const PhuongXa = sequelize.define("PhuongXa", {
  id_phuong_xa: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  ma_xa: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  ten_xa: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  cap_xa: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  id_tinh_thanh: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  vi_do_trung_tam: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
  },
  kinh_do_trung_tam: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
  },
}, {
  tableName: "phuong_xa",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
  indexes: [
    { unique: true, fields: ["ma_xa"] },
    { fields: ["id_tinh_thanh"] },
    { fields: ["id_tinh_thanh", "ten_xa"] },
  ],
});

module.exports = PhuongXa;
