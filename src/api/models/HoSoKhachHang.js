const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/database");

const HoSoKhachHang = sequelize.define(
  "HoSoKhachHang",
  {
    id_ho_so: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    id_nguoi_dung: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    id_chinh_sach: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    id_ao: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },

    id_vu_nuoi: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true, 
    },

    dinh_muc_cong_no: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    trang_thai_ho_so: {
      type: DataTypes.ENUM(
        "cho_kiem_tra",
        "cho_de_xuat",
        "cho_admin_duyet",
        "da_duyet",
        "tu_choi"
      ),
      defaultValue: "cho_kiem_tra",
    },

    ly_do_tu_choi: {
      type: DataTypes.TEXT,
    },

    bi_khoa_tra_sau: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    ly_do_khoa: {
      type: DataTypes.TEXT,
    },
    duoc_phep_tra_sau: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    han_thanh_toan: {
      type: DataTypes.DATE,
    },

    ngay_duyet: {
      type: DataTypes.DATE,
    },

    ghi_chu: {
      type: DataTypes.TEXT,
    },
    anh_cccd_mat_truoc: {
      type: DataTypes.STRING(500),
    },

    anh_cccd_mat_sau: {
      type: DataTypes.STRING(500),
    },

    anh_selfie: {
      type: DataTypes.STRING(500),
    },

    do_tuong_dong: {
      type: DataTypes.DECIMAL(5, 2),
    },

    trang_thai_xac_thuc: {
      type: DataTypes.ENUM(
        "chua_xac_thuc",
        "da_xac_thuc",
        "that_bai"
      ),
      defaultValue: "chua_xac_thuc",
    },

    ly_do_xac_thuc_that_bai: {
      type: DataTypes.TEXT,
    },

    ngay_xac_thuc: {
      type: DataTypes.DATE,
    },
  },
  {
    tableName: "ho_so_khach_hang",
    timestamps: false,
  }
);

module.exports = HoSoKhachHang;