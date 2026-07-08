const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const PhieuDeXuatHanMuc = sequelize.define(
  "PhieuDeXuatHanMuc",
  {
    id_phieu_de_xuat: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_ho_so: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_nhan_vien_de_xuat: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_admin_duyet: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    han_muc_hien_tai: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    han_muc_de_xuat: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    han_muc_duoc_duyet: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },

    ly_do_de_xuat: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    nhan_xet_khao_sat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ph: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
    },

    oxy_hoa_tan: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },

    kich_co_tom: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    hinh_anh_khao_sat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    trang_thai: {
      type: DataTypes.ENUM("cho_duyet", "da_duyet", "tu_choi"),
      defaultValue: "cho_duyet",
    },

    ly_do_tu_choi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    ngay_de_xuat: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },

    ngay_duyet: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "phieu_de_xuat_han_muc",
    timestamps: false,
  }
);

module.exports = PhieuDeXuatHanMuc;
