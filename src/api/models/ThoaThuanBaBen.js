const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ThoaThuanBaBen = sequelize.define(
  "ThoaThuanBaBen",
  {
    id_thoa_thuan: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_ho_so: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_thuong_lai: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    id_admin_yeu_cau: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_nhan_vien_phu_trach: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_nhan_vien_upload: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    id_admin_xac_nhan: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    gia_tri_han_muc: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    ly_do_yeu_cau: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    noi_dung_thoa_thuan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    file_thoa_thuan: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    ngay_yeu_cau: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    ngay_upload: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ngay_ky: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ngay_xac_nhan: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ngay_hieu_luc: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ngay_het_hieu_luc: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    trang_thai: {
      type: DataTypes.ENUM(
        "cho_lap",
        "cho_ky",
        "cho_xac_nhan",
        "da_hieu_luc",
        "huy"
      ),
      defaultValue: "cho_lap",
    },

    ly_do_huy: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "thoa_thuan_ba_ben",
    timestamps: false,
  }
);

module.exports = ThoaThuanBaBen;