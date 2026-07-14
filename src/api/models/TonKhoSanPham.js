const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const TonKhoSanPham = sequelize.define(
  "TonKhoSanPham",
  {
    id_ton_kho: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    id_san_pham: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_kho_hang: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    so_luong: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "ton_kho_san_pham",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
    indexes: [
      {
        unique: true,
        fields: ["id_san_pham", "id_kho_hang"],
      },
    ],
  }
);

module.exports = TonKhoSanPham;
