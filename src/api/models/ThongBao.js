const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ThongBao = sequelize.define(
  "ThongBao",
  {
    id_thong_bao: {
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

    noi_dung: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    loai: {
      type: DataTypes.ENUM(
        "don_hang",
        "thanh_toan",
        "giao_hang",
        "ao_nuoi",
        "cong_no",
        "ho_so",
        "kho_hang",
        "he_thong"
      ),
      defaultValue: "he_thong",
    },

    da_doc: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    lien_ket: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    ngay_tao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "thong_bao",
    timestamps: false,
  }
);

module.exports = ThongBao;
