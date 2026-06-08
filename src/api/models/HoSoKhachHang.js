const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const HoSoKhachHang = sequelize.define("HoSoKhachHang", {
  id_ho_so: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_ao: {
  type: DataTypes.BIGINT,
  allowNull: false,
},
  id_nguoi_dung: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_dinh_muc: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  duoc_phep_tra_sau: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  han_chot: {
    type: DataTypes.DATE,
  },
  ngay_duyet: {
    type: DataTypes.DATE,
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "ho_so_khach_hang",
  timestamps: false,
});

module.exports = HoSoKhachHang;