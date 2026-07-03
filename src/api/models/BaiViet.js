const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const BaiViet = sequelize.define("BaiViet", {
  id_bai_viet: {
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
hinh_anh: {
    type: DataTypes.TEXT,
    allowNull: true,
},
  trang_thai: {
    type: DataTypes.ENUM("cho_duyet", "da_dang", "an"),
    defaultValue: "cho_duyet",
  },
  ngay_dang: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "bai_viet",
  timestamps: false,
});

module.exports = BaiViet;