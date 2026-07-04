const NguoiDung = require("./NguoiDung");
const DanhMuc = require("./DanhMuc");
const SanPham = require("./SanPham");
const AoNuoi = require("./AoNuoi");
const VuNuoi = require("./VuNuoi");
const DonHang = require("./DonHang");
const ChiTietDonHang = require("./ChiTietDonHang");
const ThanhToan = require("./ThanhToan");
const GiaoHang = require("./GiaoHang");
const HopDong = require("./HopDong");
const HoSoKhachHang = require("./HoSoKhachHang");
const BaiViet = require("./BaiViet");
const BinhLuan = require("./BinhLuan");
const NhanVienGiaoHang = require("./NhanVienGiaoHang");
const GiaHanThanhToan = require("./GiaHanThanhToan");
const ThanhToanCongNo = require("./ThanhToanCongNo");
const ChiTietThanhToanCongNo = require("./ChiTietThanhToanCongNo");
const ThongBao = require("./ThongBao");
NguoiDung.hasMany(ThongBao, {
  foreignKey: "id_nguoi_dung",
});

ThongBao.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// NguoiDung - ThanhToanCongNo
NguoiDung.hasMany(ThanhToanCongNo, {
  foreignKey: "id_nguoi_dung",
});
ThanhToanCongNo.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// HoSoKhachHang - ThanhToanCongNo
HoSoKhachHang.hasMany(ThanhToanCongNo, {
  foreignKey: "id_ho_so",
});
ThanhToanCongNo.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});
// ThanhToanCongNo - ChiTietThanhToanCongNo
ThanhToanCongNo.hasMany(ChiTietThanhToanCongNo, {
  foreignKey: "id_thanh_toan_cong_no",
});
ChiTietThanhToanCongNo.belongsTo(ThanhToanCongNo, {
  foreignKey: "id_thanh_toan_cong_no",
});

// DonHang - ChiTietThanhToanCongNo
DonHang.hasMany(ChiTietThanhToanCongNo, {
  foreignKey: "id_don_hang",
});
ChiTietThanhToanCongNo.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

// NguoiDung - HoSoKhachHang
NguoiDung.hasMany(HoSoKhachHang, {
  foreignKey: "id_nguoi_dung",
});
HoSoKhachHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

// AoNuoi - HoSoKhachHang
AoNuoi.hasMany(HoSoKhachHang, {
  foreignKey: "id_ao",
});
HoSoKhachHang.belongsTo(AoNuoi, {
  foreignKey: "id_ao",
});

// AoNuoi - VuNuoi
AoNuoi.hasMany(VuNuoi, {
  foreignKey: "id_ao",
});
VuNuoi.belongsTo(AoNuoi, {
  foreignKey: "id_ao",
});

// VuNuoi - HoSoKhachHang
VuNuoi.hasOne(HoSoKhachHang, {
  foreignKey: "id_vu_nuoi",
});
HoSoKhachHang.belongsTo(VuNuoi, {
  foreignKey: "id_vu_nuoi",
});

// NguoiDung - DonHang
NguoiDung.hasMany(DonHang, {
  foreignKey: "id_nguoi_dung",
});
DonHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

// VuNuoi - DonHang
VuNuoi.hasMany(DonHang, {
  foreignKey: "id_vu_nuoi",
});
DonHang.belongsTo(VuNuoi, {
  foreignKey: "id_vu_nuoi",
});

// DanhMuc - SanPham
DanhMuc.hasMany(SanPham, {
  foreignKey: "id_danh_muc",
});
SanPham.belongsTo(DanhMuc, {
  foreignKey: "id_danh_muc",
});

// DonHang - ChiTietDonHang
DonHang.hasMany(ChiTietDonHang, {
  foreignKey: "id_don_hang",
});
ChiTietDonHang.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

// SanPham - ChiTietDonHang
SanPham.hasMany(ChiTietDonHang, {
  foreignKey: "id_san_pham",
});
ChiTietDonHang.belongsTo(SanPham, {
  foreignKey: "id_san_pham",
});

// DonHang - ThanhToan
DonHang.hasMany(ThanhToan, {
  foreignKey: "id_don_hang",
});
ThanhToan.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

// DonHang - GiaoHang
DonHang.hasMany(GiaoHang, {
  foreignKey: "id_don_hang",
});
GiaoHang.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

// NguoiDung - NhanVienGiaoHang
NguoiDung.hasOne(NhanVienGiaoHang, {
  foreignKey: "id_nguoi_dung",
});
NhanVienGiaoHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

// NhanVienGiaoHang - GiaoHang
NhanVienGiaoHang.hasMany(GiaoHang, {
  foreignKey: "id_nhan_vien_giao",
});
GiaoHang.belongsTo(NhanVienGiaoHang, {
  foreignKey: "id_nhan_vien_giao",
});

// DonHang - HopDong
DonHang.hasOne(HopDong, {
  foreignKey: "id_don_hang",
});
HopDong.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

// NguoiDung - BaiViet
NguoiDung.hasMany(BaiViet, {
  foreignKey: "id_nguoi_dung",
});
BaiViet.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

// BaiViet - BinhLuan
BaiViet.hasMany(BinhLuan, {
  foreignKey: "id_bai_viet",
});
BinhLuan.belongsTo(BaiViet, {
  foreignKey: "id_bai_viet",
});

// NguoiDung - BinhLuan
NguoiDung.hasMany(BinhLuan, {
  foreignKey: "id_nguoi_dung",
});
BinhLuan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

// HoSoKhachHang - GiaHanThanhToan
HoSoKhachHang.hasMany(GiaHanThanhToan, {
  foreignKey: "id_ho_so",
});
GiaHanThanhToan.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

// NguoiDung - GiaHanThanhToan người gửi
NguoiDung.hasMany(GiaHanThanhToan, {
  foreignKey: "id_nguoi_gui",
  as: "gia_han_da_gui",
});
GiaHanThanhToan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_gui",
  as: "nguoi_gui",
});

// NguoiDung - GiaHanThanhToan người duyệt
NguoiDung.hasMany(GiaHanThanhToan, {
  foreignKey: "id_nguoi_duyet",
  as: "gia_han_da_duyet",
});
GiaHanThanhToan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_duyet",
  as: "nguoi_duyet",
});

module.exports = {
  NguoiDung,
  DanhMuc,
  SanPham,
  AoNuoi,
  VuNuoi,
  DonHang,
  ChiTietDonHang,
  ThanhToan,
  GiaoHang,
  HopDong,
  HoSoKhachHang,
  BaiViet,
  BinhLuan,
  NhanVienGiaoHang,
  GiaHanThanhToan,
  ThanhToanCongNo,
  ChiTietThanhToanCongNo,
  ThongBao
};