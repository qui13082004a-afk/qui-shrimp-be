const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const BaiViet = sequelize.define(
  "BaiViet",
  {
    id_bai_viet: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    tieu_de: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tom_tat: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    noi_dung: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hinh_anh: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    luot_xem: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    trang_thai: {
      type: DataTypes.ENUM("ban_nhap", "cho_duyet", "da_dang", "an"),
      defaultValue: "cho_duyet",
    },
    ngay_dang: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    ngay_cap_nhat: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "bai_viet",
    timestamps: false,
  }
);

module.exports = BaiViet;
