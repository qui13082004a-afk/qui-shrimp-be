const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const BinhLuan = sequelize.define(
  "BinhLuan",
  {
    id_binh_luan: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_bai_viet: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    noi_dung: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    hinh_anh: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    id_binh_luan_cha: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    trang_thai: {
      type: DataTypes.ENUM("hien", "an"),
      defaultValue: "hien",
    },

    ngay_binh_luan: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "binh_luan",
    timestamps: false,
  }
);

module.exports = BinhLuan;