const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const GiaHanThanhToan = sequelize.define("GiaHanThanhToan", {
  id_gia_han: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  id_ho_so: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  id_nguoi_gui: {
  type: DataTypes.BIGINT,
  allowNull: false,
},

  id_nguoi_duyet: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  han_cu: {
    type: DataTypes.DATE,
  },
  han_de_xuat: {
    type: DataTypes.DATE,
  },
  ly_do: {
    type: DataTypes.TEXT,
  },
  ghi_chu: {
    type: DataTypes.TEXT,
  },
  trang_thai: {
    type: DataTypes.ENUM("cho_duyet", "da_duyet", "tu_choi"),
    defaultValue: "cho_duyet",
  },
  ngay_gui: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ngay_duyet: {
    type: DataTypes.DATE,
  },
}, {
  tableName: "gia_han_thanh_toan",
  timestamps: false,
});

module.exports = GiaHanThanhToan;