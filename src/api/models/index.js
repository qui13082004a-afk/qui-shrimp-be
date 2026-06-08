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
const DinhMuc = require("./DinhMuc");
const HoSoKhachHang = require("./HoSoKhachHang");
const BaiViet = require("./BaiViet");
const BinhLuan = require("./BinhLuan");
const NhanVienGiaoHang = require("./NhanVienGiaoHang");
const GiaHanThanhToan = require("./GiaHanThanhToan");
// 1-n NguoiDung - HoSoKhachHang
NguoiDung.hasMany(HoSoKhachHang, {
  foreignKey: "id_nguoi_dung",
});

HoSoKhachHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// 1-n DinhMuc - HoSoKhachHang
DinhMuc.hasMany(HoSoKhachHang, {
  foreignKey: "id_dinh_muc",
});
HoSoKhachHang.belongsTo(DinhMuc, {
  foreignKey: "id_dinh_muc",
});
// 1-1 HoSoKhachHang - AoNuoi
AoNuoi.hasOne(HoSoKhachHang, {
  foreignKey: "id_ao",
});

HoSoKhachHang.belongsTo(AoNuoi, {
  foreignKey: "id_ao",
});
// 1-n AoNuoi - VuNuoi
AoNuoi.hasMany(VuNuoi, {
  foreignKey: "id_ao",
});
VuNuoi.belongsTo(AoNuoi, {
  foreignKey: "id_ao",
});
// 1-n NguoiDung - DonHang
NguoiDung.hasMany(DonHang, {
  foreignKey: "id_nguoi_dung",
});
DonHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// 1-n VuNuoi - DonHang
VuNuoi.hasMany(DonHang, {
  foreignKey: "id_vu_nuoi",
});
DonHang.belongsTo(VuNuoi, {
  foreignKey: "id_vu_nuoi",
});
// 1-n DanhMuc - SanPham
DanhMuc.hasMany(SanPham, {
  foreignKey: "id_danh_muc",
});
SanPham.belongsTo(DanhMuc, {
  foreignKey: "id_danh_muc",
});
// 1-n DonHang - ChiTietDonHang
DonHang.hasMany(ChiTietDonHang, {
  foreignKey: "id_don_hang",
});
ChiTietDonHang.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});
// 1-n SanPham - ChiTietDonHang
SanPham.hasMany(ChiTietDonHang, {
  foreignKey: "id_san_pham",
});
ChiTietDonHang.belongsTo(SanPham, {
  foreignKey: "id_san_pham",
});
// 1-n DonHang - ThanhToan
DonHang.hasMany(ThanhToan, {
  foreignKey: "id_don_hang",
});
ThanhToan.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});
// 1-n DonHang - GiaoHang
DonHang.hasMany(GiaoHang, {
  foreignKey: "id_don_hang",
});

GiaoHang.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});
// 1-0..1 NguoiDung - NhanVienGiaoHang
NguoiDung.hasOne(NhanVienGiaoHang, {
  foreignKey: "id_nguoi_dung",
});
NhanVienGiaoHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// 1-n NhanVienGiaoHang - GiaoHang
NhanVienGiaoHang.hasMany(GiaoHang, {
  foreignKey: "id_nhan_vien_giao",
});
GiaoHang.belongsTo(NhanVienGiaoHang, {
  foreignKey: "id_nhan_vien_giao",
});
// 1-1 DonHang - HopDong
DonHang.hasOne(HopDong, {
  foreignKey: "id_don_hang",
});
HopDong.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});
// 1-n NguoiDung - BaiViet
NguoiDung.hasMany(BaiViet, {
  foreignKey: "id_nguoi_dung",
});
BaiViet.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// 1-n BaiViet - BinhLuan
BaiViet.hasMany(BinhLuan, {
  foreignKey: "id_bai_viet",
});
BinhLuan.belongsTo(BaiViet, {
  foreignKey: "id_bai_viet",
});
// 1-n NguoiDung - BinhLuan
NguoiDung.hasMany(BinhLuan, {
  foreignKey: "id_nguoi_dung",
});
BinhLuan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});
// 1-n HoSoKhachHang - GiaHanThanhToan
HoSoKhachHang.hasMany(GiaHanThanhToan, {
  foreignKey: "id_ho_so",
});

GiaHanThanhToan.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});
// 1-n NguoiDung(KhachHang) - GiaHanThanhToan
NguoiDung.hasMany(GiaHanThanhToan, {
  foreignKey: "id_nguoi_gui",
  as: "gia_han_da_gui",
});

GiaHanThanhToan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_gui",
  as: "nguoi_gui",
});
// 1-n NguoiDung(Admin) - GiaHanThanhToan
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
  DinhMuc,
  HoSoKhachHang,
  BaiViet,
  BinhLuan,
  NhanVienGiaoHang,
  GiaHanThanhToan,
};