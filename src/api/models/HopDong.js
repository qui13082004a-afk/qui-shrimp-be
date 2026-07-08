const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const HopDong = sequelize.define(
  "HopDong",
  {
    id_hop_dong: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_ho_so: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true,
    },

    file_hop_dong: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    ngay_tao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    ngay_ky: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ngay_upload: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ngay_xac_nhan: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    id_nhan_vien_upload: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    id_admin_xac_nhan: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
dieu_khoan_bo_sung: {  
  type: DataTypes.TEXT,
  allowNull: true,
},
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    trang_thai: {
      type: DataTypes.ENUM("cho_ky", "cho_xac_nhan", "da_ky", "huy"),
      defaultValue: "cho_ky",
    },
  },
  {
    tableName: "hop_dong",
    timestamps: false,
  }
);

module.exports = HopDong;