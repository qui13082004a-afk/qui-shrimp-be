const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const DanhMuc = sequelize.define("DanhMuc", {
  id_danh_muc: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  ten_danh_muc: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  mo_ta: {
    type: DataTypes.TEXT,
  },
  anh_danh_muc: {
    type: DataTypes.STRING(255),
  },
  trang_thai: {
    type: DataTypes.ENUM("hoat_dong", "an"),
    defaultValue: "hoat_dong",
  },
}, {
  tableName: "danh_muc",
  timestamps: false,
});

module.exports = DanhMuc;