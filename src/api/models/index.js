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
const ThuongLai = require("./ThuongLai");
const ThoaThuanBaBen = require("./ThoaThuanBaBen");
const PhieuDeXuatHanMuc = require("./PhieuDeXuatHanMuc");
const ChinhSachHanMuc = require("./ChinhSachHanMuc");
const TinhThanh = require("./TinhThanh");
const PhuongXa = require("./PhuongXa");
const KhuVucKinhDoanh = require("./KhuVucKinhDoanh");
const CauHinhDiemXuatPhat = require("./CauHinhDiemXuatPhat");
const MucPhiVanChuyen = require("./MucPhiVanChuyen");
const KhoHang = require("./KhoHang");
const TonKhoSanPham = require("./TonKhoSanPham");
const NhanVienDinhMucKhuVuc = require("./NhanVienDinhMucKhuVuc");
const DiaChiGiaoHang = require("./DiaChiGiaoHang");

const KhuVucHoTroTraSau = require("./KhuVucHoTroTraSau");
KhuVucHoTroTraSau.hasMany(HoSoKhachHang, { foreignKey: "id_khu_vuc" });
HoSoKhachHang.belongsTo(KhuVucHoTroTraSau, { foreignKey: "id_khu_vuc" });

/* =========================
   KHU VUC / VI TRI / PHI VAN CHUYEN
========================= */
TinhThanh.hasMany(PhuongXa, {
  foreignKey: "id_tinh_thanh",
});
PhuongXa.belongsTo(TinhThanh, {
  foreignKey: "id_tinh_thanh",
});

TinhThanh.hasOne(KhuVucKinhDoanh, {
  foreignKey: "id_tinh_thanh",
});
KhuVucKinhDoanh.belongsTo(TinhThanh, {
  foreignKey: "id_tinh_thanh",
});

KhuVucKinhDoanh.hasMany(MucPhiVanChuyen, {
  foreignKey: "id_khu_vuc",
});
MucPhiVanChuyen.belongsTo(KhuVucKinhDoanh, {
  foreignKey: "id_khu_vuc",
});

CauHinhDiemXuatPhat.hasMany(KhoHang, {
  foreignKey: "id_diem_xuat_phat",
});
KhoHang.belongsTo(CauHinhDiemXuatPhat, {
  foreignKey: "id_diem_xuat_phat",
});

KhoHang.hasMany(TonKhoSanPham, {
  foreignKey: "id_kho_hang",
});
TonKhoSanPham.belongsTo(KhoHang, {
  foreignKey: "id_kho_hang",
});

SanPham.hasMany(TonKhoSanPham, {
  foreignKey: "id_san_pham",
});
TonKhoSanPham.belongsTo(SanPham, {
  foreignKey: "id_san_pham",
});

NguoiDung.hasMany(NhanVienDinhMucKhuVuc, {
  foreignKey: "id_nguoi_dung",
});
NhanVienDinhMucKhuVuc.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

KhuVucHoTroTraSau.hasMany(NhanVienDinhMucKhuVuc, {
  foreignKey: "id_khu_vuc",
});
NhanVienDinhMucKhuVuc.belongsTo(KhuVucHoTroTraSau, {
  foreignKey: "id_khu_vuc",
});

TinhThanh.hasMany(AoNuoi, {
  foreignKey: "id_tinh_thanh",
});
AoNuoi.belongsTo(TinhThanh, {
  foreignKey: "id_tinh_thanh",
});

PhuongXa.hasMany(AoNuoi, {
  foreignKey: "id_phuong_xa",
});
AoNuoi.belongsTo(PhuongXa, {
  foreignKey: "id_phuong_xa",
});

NguoiDung.hasMany(DiaChiGiaoHang, {
  foreignKey: "id_nguoi_dung",
});
DiaChiGiaoHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

TinhThanh.hasMany(DiaChiGiaoHang, {
  foreignKey: "id_tinh_thanh",
});
DiaChiGiaoHang.belongsTo(TinhThanh, {
  foreignKey: "id_tinh_thanh",
});

PhuongXa.hasMany(DiaChiGiaoHang, {
  foreignKey: "id_phuong_xa",
});
DiaChiGiaoHang.belongsTo(PhuongXa, {
  foreignKey: "id_phuong_xa",
});

KhuVucKinhDoanh.hasMany(DonHang, {
  foreignKey: "id_khu_vuc_giao_hang",
});
DonHang.belongsTo(KhuVucKinhDoanh, {
  foreignKey: "id_khu_vuc_giao_hang",
});

CauHinhDiemXuatPhat.hasMany(DonHang, {
  foreignKey: "id_diem_xuat_phat",
});
DonHang.belongsTo(CauHinhDiemXuatPhat, {
  foreignKey: "id_diem_xuat_phat",
});

/* =========================
   CHÍNH SÁCH HẠN MỨC
========================= */
ChinhSachHanMuc.hasMany(HoSoKhachHang, {
  foreignKey: "id_chinh_sach",
});
HoSoKhachHang.belongsTo(ChinhSachHanMuc, {
  foreignKey: "id_chinh_sach",
});

NguoiDung.hasMany(ChinhSachHanMuc, {
  foreignKey: "id_admin_cap_nhat",
  as: "chinh_sach_da_cap_nhat",
});
ChinhSachHanMuc.belongsTo(NguoiDung, {
  foreignKey: "id_admin_cap_nhat",
  as: "admin_cap_nhat",
});

/* =========================
   PHIẾU ĐỀ XUẤT HẠN MỨC
========================= */
HoSoKhachHang.hasMany(PhieuDeXuatHanMuc, {
  foreignKey: "id_ho_so",
});
PhieuDeXuatHanMuc.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

NguoiDung.hasMany(PhieuDeXuatHanMuc, {
  foreignKey: "id_nhan_vien_de_xuat",
  as: "phieu_de_xuat_da_gui",
});
PhieuDeXuatHanMuc.belongsTo(NguoiDung, {
  foreignKey: "id_nhan_vien_de_xuat",
  as: "nhan_vien_de_xuat",
});

NguoiDung.hasMany(PhieuDeXuatHanMuc, {
  foreignKey: "id_admin_duyet",
  as: "phieu_de_xuat_da_duyet",
});
PhieuDeXuatHanMuc.belongsTo(NguoiDung, {
  foreignKey: "id_admin_duyet",
  as: "admin_duyet",
});
PhieuDeXuatHanMuc.belongsTo(ChinhSachHanMuc, {
  foreignKey: "id_chinh_sach",
});

ChinhSachHanMuc.hasMany(PhieuDeXuatHanMuc, {
  foreignKey: "id_chinh_sach",
});
/* =========================
   THỎA THUẬN BA BÊN
========================= */
HoSoKhachHang.hasMany(ThoaThuanBaBen, {
  foreignKey: "id_ho_so",
});
ThoaThuanBaBen.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

ThuongLai.hasMany(ThoaThuanBaBen, {
  foreignKey: "id_thuong_lai",
});
ThoaThuanBaBen.belongsTo(ThuongLai, {
  foreignKey: "id_thuong_lai",
});

NguoiDung.hasMany(ThoaThuanBaBen, {
  foreignKey: "id_admin_yeu_cau",
  as: "yeu_cau_thoa_thuan_ba_ben",
});
ThoaThuanBaBen.belongsTo(NguoiDung, {
  foreignKey: "id_admin_yeu_cau",
  as: "admin_yeu_cau_thoa_thuan",
});

NguoiDung.hasMany(ThoaThuanBaBen, {
  foreignKey: "id_nhan_vien_phu_trach",
  as: "thoa_thuan_duoc_giao",
});
ThoaThuanBaBen.belongsTo(NguoiDung, {
  foreignKey: "id_nhan_vien_phu_trach",
  as: "nhan_vien_phu_trach_thoa_thuan",
});

NguoiDung.hasMany(ThoaThuanBaBen, {
  foreignKey: "id_nhan_vien_upload",
  as: "thoa_thuan_da_upload",
});
ThoaThuanBaBen.belongsTo(NguoiDung, {
  foreignKey: "id_nhan_vien_upload",
  as: "nhan_vien_upload_thoa_thuan",
});

NguoiDung.hasMany(ThoaThuanBaBen, {
  foreignKey: "id_admin_xac_nhan",
  as: "thoa_thuan_da_xac_nhan",
});
ThoaThuanBaBen.belongsTo(NguoiDung, {
  foreignKey: "id_admin_xac_nhan",
  as: "admin_xac_nhan_thoa_thuan",
});

/* =========================
   HỒ SƠ KHÁCH HÀNG
========================= */
NguoiDung.hasMany(HoSoKhachHang, {
  foreignKey: "id_nguoi_dung",
});
HoSoKhachHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

AoNuoi.hasMany(HoSoKhachHang, {
  foreignKey: "id_ao",
});
HoSoKhachHang.belongsTo(AoNuoi, {
  foreignKey: "id_ao",
});

VuNuoi.hasOne(HoSoKhachHang, {
  foreignKey: "id_vu_nuoi",
});
HoSoKhachHang.belongsTo(VuNuoi, {
  foreignKey: "id_vu_nuoi",
});

/* =========================
   HỢP ĐỒNG THEO HỒ SƠ
========================= */
HoSoKhachHang.hasOne(HopDong, {
  foreignKey: "id_ho_so",
});
HopDong.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

NguoiDung.hasMany(HopDong, {
  foreignKey: "id_nhan_vien_upload",
  as: "hop_dong_da_upload",
});
HopDong.belongsTo(NguoiDung, {
  foreignKey: "id_nhan_vien_upload",
  as: "nhan_vien_upload_hop_dong",
});

NguoiDung.hasMany(HopDong, {
  foreignKey: "id_admin_xac_nhan",
  as: "hop_dong_da_xac_nhan",
});
HopDong.belongsTo(NguoiDung, {
  foreignKey: "id_admin_xac_nhan",
  as: "admin_xac_nhan_hop_dong",
});

/* =========================
   AO NUÔI / VỤ NUÔI
========================= */
AoNuoi.hasMany(VuNuoi, {
  foreignKey: "id_ao",
});
VuNuoi.belongsTo(AoNuoi, {
  foreignKey: "id_ao",
});

/* =========================
   ĐƠN HÀNG
========================= */
NguoiDung.hasMany(DonHang, {
  foreignKey: "id_nguoi_dung",
});
DonHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

VuNuoi.hasMany(DonHang, {
  foreignKey: "id_vu_nuoi",
});
DonHang.belongsTo(VuNuoi, {
  foreignKey: "id_vu_nuoi",
});

HoSoKhachHang.hasMany(DonHang, {
  foreignKey: "id_ho_so",
});
DonHang.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

DonHang.hasMany(ChiTietDonHang, {
  foreignKey: "id_don_hang",
});
ChiTietDonHang.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

SanPham.hasMany(ChiTietDonHang, {
  foreignKey: "id_san_pham",
});
ChiTietDonHang.belongsTo(SanPham, {
  foreignKey: "id_san_pham",
});

/* =========================
   DANH MỤC / SẢN PHẨM
========================= */
DanhMuc.hasMany(SanPham, {
  foreignKey: "id_danh_muc",
});
SanPham.belongsTo(DanhMuc, {
  foreignKey: "id_danh_muc",
});

/* =========================
   THANH TOÁN ĐƠN HÀNG
========================= */
DonHang.hasMany(ThanhToan, {
  foreignKey: "id_don_hang",
});
ThanhToan.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

/* =========================
   GIAO HÀNG
========================= */
DonHang.hasMany(GiaoHang, {
  foreignKey: "id_don_hang",
});
GiaoHang.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

NguoiDung.hasOne(NhanVienGiaoHang, {
  foreignKey: "id_nguoi_dung",
});
NhanVienGiaoHang.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

NhanVienGiaoHang.hasMany(GiaoHang, {
  foreignKey: "id_nhan_vien_giao",
});
GiaoHang.belongsTo(NhanVienGiaoHang, {
  foreignKey: "id_nhan_vien_giao",
});

/* =========================
   THANH TOÁN CÔNG NỢ
========================= */
NguoiDung.hasMany(ThanhToanCongNo, {
  foreignKey: "id_nguoi_dung",
});
ThanhToanCongNo.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

HoSoKhachHang.hasMany(ThanhToanCongNo, {
  foreignKey: "id_ho_so",
});
ThanhToanCongNo.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

ThanhToanCongNo.hasMany(ChiTietThanhToanCongNo, {
  foreignKey: "id_thanh_toan_cong_no",
});
ChiTietThanhToanCongNo.belongsTo(ThanhToanCongNo, {
  foreignKey: "id_thanh_toan_cong_no",
});

DonHang.hasMany(ChiTietThanhToanCongNo, {
  foreignKey: "id_don_hang",
});
ChiTietThanhToanCongNo.belongsTo(DonHang, {
  foreignKey: "id_don_hang",
});

/* =========================
   GIA HẠN THANH TOÁN
========================= */
HoSoKhachHang.hasMany(GiaHanThanhToan, {
  foreignKey: "id_ho_so",
});
GiaHanThanhToan.belongsTo(HoSoKhachHang, {
  foreignKey: "id_ho_so",
});

NguoiDung.hasMany(GiaHanThanhToan, {
  foreignKey: "id_nguoi_gui",
  as: "gia_han_da_gui",
});
GiaHanThanhToan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_gui",
  as: "nguoi_gui",
});

NguoiDung.hasMany(GiaHanThanhToan, {
  foreignKey: "id_nguoi_duyet",
  as: "gia_han_da_duyet",
});
GiaHanThanhToan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_duyet",
  as: "nguoi_duyet",
});

/* =========================
   THÔNG BÁO
========================= */
NguoiDung.hasMany(ThongBao, {
  foreignKey: "id_nguoi_dung",
});
ThongBao.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

/* =========================
   BÀI VIẾT / BÌNH LUẬN
========================= */
NguoiDung.hasMany(BaiViet, {
  foreignKey: "id_nguoi_dung",
});
BaiViet.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
});

BaiViet.hasMany(BinhLuan, {
  foreignKey: "id_bai_viet",
});
BinhLuan.belongsTo(BaiViet, {
  foreignKey: "id_bai_viet",
});

NguoiDung.hasMany(BinhLuan, {
  foreignKey: "id_nguoi_dung",
});
BinhLuan.belongsTo(NguoiDung, {
  foreignKey: "id_nguoi_dung",
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
  ThongBao,
  ThuongLai,
  ThoaThuanBaBen,
  PhieuDeXuatHanMuc,
  ChinhSachHanMuc,
  KhuVucHoTroTraSau,
  TinhThanh,
  PhuongXa,
  KhuVucKinhDoanh,
  CauHinhDiemXuatPhat,
  MucPhiVanChuyen,
  KhoHang,
  TonKhoSanPham,
  NhanVienDinhMucKhuVuc,
  DiaChiGiaoHang,
};
