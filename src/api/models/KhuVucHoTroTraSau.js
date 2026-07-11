const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const KhuVucHoTroTraSau = sequelize.define(
  "KhuVucHoTroTraSau",
  {
    id_khu_vuc: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    tinh_thanh: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    quan_huyen: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phuong_xa: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "NULL nghĩa là hỗ trợ toàn bộ quận/huyện",
    },
    trang_thai: {
      type: DataTypes.ENUM("hoat_dong", "tam_ngung"),
      allowNull: false,
      defaultValue: "hoat_dong",
    },
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "khu_vuc_ho_tro_tra_sau",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
    indexes: [
      {
        unique: true,
        fields: ["tinh_thanh", "quan_huyen", "phuong_xa"],
        name: "uq_khu_vuc_tra_sau",
      },
    ],
  }
);

module.exports = KhuVucHoTroTraSau;
