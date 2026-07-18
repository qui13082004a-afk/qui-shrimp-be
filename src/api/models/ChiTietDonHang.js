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
  id_kho_khach_chon: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  id_kho_xuat_thuc_te: {
    type: DataTypes.BIGINT,
    allowNull: true,
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
  trang_thai_phan_bo: {
    type: DataTypes.ENUM(
      "cho_phan_bo",
      "da_phan_bo",
      "da_chuyen_kho",
      "khong_du_hang"
    ),
    defaultValue: "cho_phan_bo",
  },
}, {
  tableName: "chi_tiet_don_hang",
  timestamps: false,
});

module.exports = ChiTietDonHang;
