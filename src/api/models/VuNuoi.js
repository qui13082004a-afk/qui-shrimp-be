const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const VuNuoi = sequelize.define("VuNuoi", {
  id_vu_nuoi: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_ao: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  ten_vu_nuoi: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  ngay_tha_giong: {
    type: DataTypes.DATEONLY,
  },
  so_luong_giong: {
    type: DataTypes.INTEGER,
  },
  ngay_thu_hoach_du_kien: {
    type: DataTypes.DATEONLY,
  },
  trang_thai: {
    type: DataTypes.ENUM("dang_nuoi", "da_thu_hoach", "huy"),
    defaultValue: "dang_nuoi",
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "vu_nuoi",
  timestamps: false,
});

module.exports = VuNuoi;