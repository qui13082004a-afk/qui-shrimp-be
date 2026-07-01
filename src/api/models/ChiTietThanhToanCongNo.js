const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ChiTietThanhToanCongNo = sequelize.define(
  "ChiTietThanhToanCongNo",
  {
    id_chi_tiet_thanh_toan_cong_no: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    id_thanh_toan_cong_no: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_don_hang: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    so_tien_phan_bo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    ngay_phan_bo: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "chi_tiet_thanh_toan_cong_no",
    timestamps: false,
  }
);

module.exports = ChiTietThanhToanCongNo;