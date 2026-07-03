const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ThanhToanCongNo = sequelize.define(
  "ThanhToanCongNo",
  {
    id_thanh_toan_cong_no: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_ho_so: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    so_tien: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    ma_giao_dich: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    trang_thai: {
      type: DataTypes.ENUM("cho_thanh_toan", "thanh_cong", "that_bai"),
      defaultValue: "cho_thanh_toan",
    },
    ngay_tao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ngay_thanh_toan: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "thanh_toan_cong_no",
    timestamps: false,
  }
);