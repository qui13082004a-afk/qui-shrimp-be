const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const GiaoHang = sequelize.define("GiaoHang", {
  id_giao_hang: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_don_hang: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_nhan_vien_giao: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  trang_thai: {
    type: DataTypes.ENUM("cho_giao", "dang_giao", "giao_thanh_cong", "giao_that_bai"),
    defaultValue: "cho_giao",
  },
  anh_bien_nhan: {
    type: DataTypes.STRING(255),
  },
  anh_hop_dong: {
    type: DataTypes.STRING(255),
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
  thoi_gian_giao: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "giao_hang",
  timestamps: false,
});

module.exports = GiaoHang;