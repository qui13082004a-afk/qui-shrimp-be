const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const DinhMuc = sequelize.define("DinhMuc", {
  id_dinh_muc: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  dinh_muc: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  han_muc_tien: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
  },
  mo_ta: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "dinh_muc",
  timestamps: false,
});

module.exports = DinhMuc;