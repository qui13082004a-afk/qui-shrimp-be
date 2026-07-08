const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const HopDong = sequelize.define("HopDong", {
  id_hop_dong: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

  id_ho_so: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },

  ngay_tao: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },

  ngay_ky: {
    type: DataTypes.DATE,
  },

  file_hop_dong: {
    type: DataTypes.STRING(500),
  },

  trang_thai: {
    type: DataTypes.ENUM("chua_ky", "da_ky", "huy"),
    defaultValue: "chua_ky",
  },

  ghi_chu: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: "hop_dong",
  timestamps: false,
});

module.exports = HopDong;