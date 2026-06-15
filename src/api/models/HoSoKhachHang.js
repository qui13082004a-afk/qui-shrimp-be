const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const HoSoKhachHang = sequelize.define(
  "HoSoKhachHang",
  {
    id_ho_so: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_ao: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_vu_nuoi: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true, // 1 vụ nuôi chỉ có 1 hồ sơ
    },

    dinh_muc_cong_no: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },

    duoc_phep_tra_sau: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    han_thanh_toan: {
      type: DataTypes.DATE,
    },

    ngay_duyet: {
      type: DataTypes.DATE,
    },

    ghi_chu: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "ho_so_khach_hang",
    timestamps: false,
  }
);

module.exports = HoSoKhachHang;