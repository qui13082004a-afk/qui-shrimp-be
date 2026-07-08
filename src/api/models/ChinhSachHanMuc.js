const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const ChinhSachHanMuc = sequelize.define(
  "ChinhSachHanMuc",
  {
    id_chinh_sach: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_admin_cap_nhat: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },

    ten_chinh_sach: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },

    giai_doan: {
      type: DataTypes.ENUM("giai_doan_1", "giai_doan_2", "giai_doan_3", "giai_doan_4"),
      allowNull: false,
    },

    tu_ngay: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    den_ngay: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    han_muc_toi_da: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    trang_thai: {
      type: DataTypes.ENUM("hoat_dong", "tam_dung"),
      defaultValue: "hoat_dong",
    },

    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "chinh_sach_han_muc",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
  }
);

module.exports = ChinhSachHanMuc;
