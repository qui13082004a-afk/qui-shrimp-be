const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const NguoiDung = sequelize.define("NguoiDung", {
  id_nguoi_dung: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  ho_ten: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  otp_code: {
  type: DataTypes.STRING(10),
},
otp_expires: {
  type: DataTypes.DATE,
},
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  so_dien_thoai: {
    type: DataTypes.STRING(20),
    unique: true,
  },
  mat_khau: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  vai_tro: {
    type: DataTypes.ENUM("admin", "khach_hang", "nhan_vien_giao_hang"),
    defaultValue: "khach_hang",
  },
  dia_chi: {
    type: DataTypes.TEXT,
  },
  tinh_thanh: {
    type: DataTypes.STRING(100),
  },
  trang_thai_tai_khoan: {
    type: DataTypes.ENUM("chua_xac_thuc", "hoat_dong", "khoa"),
    defaultValue: "chua_xac_thuc",
  },
  anh_dai_dien: {
    type: DataTypes.STRING(255),
  },
}, {
  tableName: "nguoi_dung",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
});

module.exports = NguoiDung;