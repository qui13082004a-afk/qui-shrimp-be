const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ThanhToan = sequelize.define("ThanhToan", {
  id_thanh_toan: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_don_hang: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  so_tien: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  phuong_thuc: {
    type: DataTypes.ENUM("cod", "chuyen_khoan", "tra_sau"),
    allowNull: false,
  },
  ma_giao_dich: {
    type: DataTypes.STRING(100),
  },
  trang_thai: {
    type: DataTypes.ENUM("cho_thanh_toan", "thanh_cong", "that_bai"),
    defaultValue: "cho_thanh_toan",
  },
  ngay_thanh_toan: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "thanh_toan",
  timestamps: false,
});

module.exports = ThanhToan;