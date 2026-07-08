const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ThuongLai = sequelize.define(
  "ThuongLai",
  {
    id_thuong_lai: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    ten_thuong_lai: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    so_dien_thoai: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    dia_chi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ma_so_thue: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    trang_thai: {
      type: DataTypes.ENUM("hoat_dong", "tam_khoa", "ngung_hop_tac"),
      defaultValue: "hoat_dong",
    },

    so_lan_tham_gia: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    so_lan_vi_pham: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "thuong_lai",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
  }
);

module.exports = ThuongLai;
