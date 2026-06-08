const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ChiTietDonHang = sequelize.define("ChiTietDonHang", {
  id_chi_tiet: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_don_hang: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_san_pham: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  gia_ban: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  so_luong_dat: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  thanh_tien: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  trang_thai_san_pham: {
    type: DataTypes.STRING(50),
  },
}, {
  tableName: "chi_tiet_don_hang",
  timestamps: false,
});

module.exports = ChiTietDonHang;