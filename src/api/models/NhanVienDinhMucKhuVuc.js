const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const NhanVienDinhMucKhuVuc = sequelize.define(
  "NhanVienDinhMucKhuVuc",
  {
    id_phan_cong: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_khu_vuc: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    trang_thai: {
      type: DataTypes.ENUM("dang_phu_trach", "ngung_phu_trach"),
      defaultValue: "dang_phu_trach",
    },
    ghi_chu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "nhan_vien_dinh_muc_khu_vuc",
    timestamps: true,
    createdAt: "ngay_tao",
    updatedAt: "ngay_cap_nhat",
    indexes: [
      {
        unique: true,
        fields: ["id_nguoi_dung", "id_khu_vuc"],
      },
    ],
  }
);

module.exports = NhanVienDinhMucKhuVuc;
