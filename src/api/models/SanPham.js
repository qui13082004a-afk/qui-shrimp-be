const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const SanPham = sequelize.define("SanPham", {
  id_san_pham: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_danh_muc: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  ten_san_pham: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  mo_ta: {
    type: DataTypes.TEXT,
  },
  cong_dung: {
    type: DataTypes.TEXT,
  },
  huong_dan_su_dung: {
    type: DataTypes.TEXT,
  },
  gia: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  don_vi_tinh: {
    type: DataTypes.STRING(50),
  },
  ton_kho: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ton_kho_toi_thieu: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
hinh_anh: {
  type: DataTypes.TEXT,
  allowNull: true,
},
  han_su_dung: {
    type: DataTypes.DATEONLY,
  },
  xuat_xu: {
    type: DataTypes.STRING(100),
  },
  trang_thai: {
    type: DataTypes.ENUM("dang_ban", "ngung_ban", "het_hang"),
    defaultValue: "dang_ban",
  },
}, {
  tableName: "san_pham",
  timestamps: true,
  createdAt: "ngay_tao",
  updatedAt: "ngay_cap_nhat",
});

module.exports = SanPham;