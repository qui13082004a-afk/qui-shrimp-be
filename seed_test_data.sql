-- Seed du lieu test cho Dat Tom API.
-- Chay file nay sau khi server da tao bang bang sequelize.sync().
-- Tat ca tai khoan seed co mat khau: 123456
-- Email:
--   admin@example.com
--   customer@example.com
--   shipper@example.com

SET FOREIGN_KEY_CHECKS = 0;

INSERT INTO nguoi_dung (
  id_nguoi_dung,
  ho_ten,
  email,
  so_dien_thoai,
  mat_khau,
  vai_tro,
  dia_chi,
  tinh_thanh,
  trang_thai_tai_khoan,
  anh_dai_dien,
  otp_code,
  otp_expires,
  ngay_tao,
  ngay_cap_nhat
) VALUES
(
  9001,
  'Admin Test',
  'admin@example.com',
  '0900009001',
  '$2b$10$mpxZKiEOjy/ARlxu9PyIa.R.Te2sxMXAhg.ovSggF/xu.0bNs6crq',
  'admin',
  'Dia chi admin test',
  'Ca Mau',
  'hoat_dong',
  'https://example.com/admin.jpg',
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  9002,
  'Khach Hang Test',
  'customer@example.com',
  '0900009002',
  '$2b$10$mpxZKiEOjy/ARlxu9PyIa.R.Te2sxMXAhg.ovSggF/xu.0bNs6crq',
  'khach_hang',
  '123 Duong Test',
  'Bac Lieu',
  'hoat_dong',
  'https://example.com/customer.jpg',
  NULL,
  NULL,
  NOW(),
  NOW()
),
(
  9003,
  'Nhan Vien Giao Hang Test',
  'shipper@example.com',
  '0900009003',
  '$2b$10$mpxZKiEOjy/ARlxu9PyIa.R.Te2sxMXAhg.ovSggF/xu.0bNs6crq',
  'nhan_vien_giao_hang',
  'Kho giao hang test',
  'Ca Mau',
  'hoat_dong',
  'https://example.com/shipper.jpg',
  NULL,
  NULL,
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  ho_ten = VALUES(ho_ten),
  so_dien_thoai = VALUES(so_dien_thoai),
  mat_khau = VALUES(mat_khau),
  vai_tro = VALUES(vai_tro),
  dia_chi = VALUES(dia_chi),
  tinh_thanh = VALUES(tinh_thanh),
  trang_thai_tai_khoan = VALUES(trang_thai_tai_khoan),
  anh_dai_dien = VALUES(anh_dai_dien),
  otp_code = NULL,
  otp_expires = NULL,
  ngay_cap_nhat = NOW();

INSERT INTO nhan_vien_giao_hang (
  id_nhan_vien_giao_hang,
  id_nguoi_dung,
  khu_vuc_phu_trach,
  ngay_bat_dau,
  trang_thai,
  ngay_lam_viec,
  ghi_chu
) VALUES (
  9003,
  9003,
  'Ca Mau, Bac Lieu',
  NOW(),
  'dang_lam',
  'Thu 2 - Thu 7',
  'Nhan vien giao hang seed de test API'
)
ON DUPLICATE KEY UPDATE
  id_nguoi_dung = VALUES(id_nguoi_dung),
  khu_vuc_phu_trach = VALUES(khu_vuc_phu_trach),
  ngay_bat_dau = VALUES(ngay_bat_dau),
  trang_thai = VALUES(trang_thai),
  ngay_lam_viec = VALUES(ngay_lam_viec),
  ghi_chu = VALUES(ghi_chu);

INSERT INTO danh_muc (
  id_danh_muc,
  ten_danh_muc,
  mo_ta,
  anh_danh_muc,
  trang_thai
) VALUES
(9001, 'Thuc an tom test', 'Danh muc thuc an dung de test API', 'https://example.com/category-feed.jpg', 'hoat_dong'),
(9002, 'Thuoc xu ly ao test', 'Danh muc thuoc va che pham test API', 'https://example.com/category-medicine.jpg', 'hoat_dong'),
(9003, 'Danh muc an test', 'Dung de test API admin xem danh muc an', 'https://example.com/category-hidden.jpg', 'an')
ON DUPLICATE KEY UPDATE
  ten_danh_muc = VALUES(ten_danh_muc),
  mo_ta = VALUES(mo_ta),
  anh_danh_muc = VALUES(anh_danh_muc),
  trang_thai = VALUES(trang_thai);

INSERT INTO san_pham (
  id_san_pham,
  id_danh_muc,
  ten_san_pham,
  mo_ta,
  cong_dung,
  huong_dan_su_dung,
  gia,
  don_vi_tinh,
  ton_kho,
  ton_kho_toi_thieu,
  hinh_anh,
  han_su_dung,
  xuat_xu,
  trang_thai,
  ngay_tao,
  ngay_cap_nhat
) VALUES
(
  9001,
  9001,
  'Thuc an tom starter test',
  'San pham seed de test tao don hang',
  'Bo sung dinh duong cho tom giai doan dau',
  'Cho an 2 lan moi ngay theo huong dan ky thuat',
  120000.00,
  'kg',
  500,
  20,
  '["https://example.com/product-feed-1.jpg"]',
  '2027-12-31',
  'Viet Nam',
  'dang_ban',
  NOW(),
  NOW()
),
(
  9002,
  9002,
  'Che pham xu ly nuoc test',
  'San pham seed de test loc va tim kiem',
  'Ho tro on dinh moi truong ao nuoi',
  'Hoa tan voi nuoc sach truoc khi tat xuong ao',
  85000.00,
  'goi',
  300,
  15,
  '["https://example.com/product-water-1.jpg"]',
  '2027-06-30',
  'Viet Nam',
  'dang_ban',
  NOW(),
  NOW()
),
(
  9003,
  9001,
  'San pham ngung ban test',
  'San pham dung de test trang thai ngung ban',
  'Khong dung de dat hang',
  'Khong ap dung',
  50000.00,
  'chai',
  0,
  0,
  '[]',
  '2027-01-01',
  'Viet Nam',
  'ngung_ban',
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE
  id_danh_muc = VALUES(id_danh_muc),
  ten_san_pham = VALUES(ten_san_pham),
  mo_ta = VALUES(mo_ta),
  cong_dung = VALUES(cong_dung),
  huong_dan_su_dung = VALUES(huong_dan_su_dung),
  gia = VALUES(gia),
  don_vi_tinh = VALUES(don_vi_tinh),
  ton_kho = VALUES(ton_kho),
  ton_kho_toi_thieu = VALUES(ton_kho_toi_thieu),
  hinh_anh = VALUES(hinh_anh),
  han_su_dung = VALUES(han_su_dung),
  xuat_xu = VALUES(xuat_xu),
  trang_thai = VALUES(trang_thai),
  ngay_cap_nhat = NOW();

INSERT INTO ao_nuoi (
  id_ao,
  id_nguoi_dung,
  ten_ao,
  dien_tich,
  dia_chi_ao,
  loai_hinh_nuoi,
  trang_thai_ao,
  ghi_chu,
  ngay_tao
) VALUES
(
  9001,
  9002,
  'Ao nuoi test 01',
  1000.00,
  'Ap Test, Xa Test, Bac Lieu',
  'tham canh',
  'dang_hoat_dong',
  'Ao seed de test API ao nuoi',
  NOW()
),
(
  9002,
  9002,
  'Ao nuoi test 02',
  800.00,
  'Ap Test 2, Xa Test, Ca Mau',
  'ban tham canh',
  'dang_hoat_dong',
  'Ao seed phu',
  NOW()
)
ON DUPLICATE KEY UPDATE
  id_nguoi_dung = VALUES(id_nguoi_dung),
  ten_ao = VALUES(ten_ao),
  dien_tich = VALUES(dien_tich),
  dia_chi_ao = VALUES(dia_chi_ao),
  loai_hinh_nuoi = VALUES(loai_hinh_nuoi),
  trang_thai_ao = VALUES(trang_thai_ao),
  ghi_chu = VALUES(ghi_chu);

INSERT INTO vu_nuoi (
  id_vu_nuoi,
  id_ao,
  ten_vu_nuoi,
  ngay_tha_giong,
  so_luong_giong,
  ngay_thu_hoach_du_kien,
  trang_thai,
  ghi_chu
) VALUES
(
  9001,
  9001,
  'Vu nuoi test 2026',
  '2026-06-01',
  50000,
  '2026-10-01',
  'dang_nuoi',
  'Vu nuoi seed de test API'
),
(
  9002,
  9002,
  'Vu nuoi phu test 2026',
  '2026-06-10',
  30000,
  '2026-10-15',
  'dang_nuoi',
  'Vu nuoi phu'
)
ON DUPLICATE KEY UPDATE
  id_ao = VALUES(id_ao),
  ten_vu_nuoi = VALUES(ten_vu_nuoi),
  ngay_tha_giong = VALUES(ngay_tha_giong),
  so_luong_giong = VALUES(so_luong_giong),
  ngay_thu_hoach_du_kien = VALUES(ngay_thu_hoach_du_kien),
  trang_thai = VALUES(trang_thai),
  ghi_chu = VALUES(ghi_chu);

INSERT INTO ho_so_khach_hang (
  id_ho_so,
  id_nguoi_dung,
  id_ao,
  id_vu_nuoi,
  dinh_muc_cong_no,
  duoc_phep_tra_sau,
  han_thanh_toan,
  ngay_duyet,
  ghi_chu
) VALUES
(
  9001,
  9002,
  9001,
  9001,
  10000000.00,
  TRUE,
  '2026-12-31 23:59:59',
  NOW(),
  'Ho so da duyet tra sau de test API'
)
ON DUPLICATE KEY UPDATE
  id_nguoi_dung = VALUES(id_nguoi_dung),
  id_ao = VALUES(id_ao),
  id_vu_nuoi = VALUES(id_vu_nuoi),
  dinh_muc_cong_no = VALUES(dinh_muc_cong_no),
  duoc_phep_tra_sau = VALUES(duoc_phep_tra_sau),
  han_thanh_toan = VALUES(han_thanh_toan),
  ngay_duyet = VALUES(ngay_duyet),
  ghi_chu = VALUES(ghi_chu);

INSERT INTO don_hang (
  id_don_hang,
  id_nguoi_dung,
  id_vu_nuoi,
  tong_tien,
  phi_van_chuyen,
  tong_thanh_toan,
  hinh_thuc_thanh_toan,
  trang_thai_don_hang,
  dia_chi_giao_hang,
  ghi_chu,
  ngay_dat,
  ngay_duyet,
  ngay_giao
) VALUES
(
  9001,
  9002,
  NULL,
  240000.00,
  0.00,
  240000.00,
  'cod',
  'cho_giao',
  '123 Dia chi giao hang test',
  'Don COD seed san sang phan cong giao hang',
  NOW(),
  NOW(),
  NULL
),
(
  9002,
  9002,
  NULL,
  85000.00,
  0.00,
  85000.00,
  'chuyen_khoan',
  'cho_thanh_toan',
  '456 Dia chi giao hang test',
  'Don chuyen khoan seed de test thanh toan',
  NOW(),
  NULL,
  NULL
),
(
  9003,
  9002,
  9001,
  120000.00,
  0.00,
  120000.00,
  'tra_sau',
  'cho_xu_ly',
  '789 Dia chi giao hang test',
  'Don tra sau seed lien ket vu nuoi',
  NOW(),
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE
  id_nguoi_dung = VALUES(id_nguoi_dung),
  id_vu_nuoi = VALUES(id_vu_nuoi),
  tong_tien = VALUES(tong_tien),
  phi_van_chuyen = VALUES(phi_van_chuyen),
  tong_thanh_toan = VALUES(tong_thanh_toan),
  hinh_thuc_thanh_toan = VALUES(hinh_thuc_thanh_toan),
  trang_thai_don_hang = VALUES(trang_thai_don_hang),
  dia_chi_giao_hang = VALUES(dia_chi_giao_hang),
  ghi_chu = VALUES(ghi_chu),
  ngay_duyet = VALUES(ngay_duyet),
  ngay_giao = VALUES(ngay_giao);

INSERT INTO chi_tiet_don_hang (
  id_chi_tiet,
  id_don_hang,
  id_san_pham,
  gia_ban,
  so_luong_dat,
  thanh_tien,
  trang_thai_san_pham
) VALUES
(9001, 9001, 9001, 120000.00, 2, 240000.00, 'dang_ban'),
(9002, 9002, 9002, 85000.00, 1, 85000.00, 'dang_ban'),
(9003, 9003, 9001, 120000.00, 1, 120000.00, 'dang_ban')
ON DUPLICATE KEY UPDATE
  id_don_hang = VALUES(id_don_hang),
  id_san_pham = VALUES(id_san_pham),
  gia_ban = VALUES(gia_ban),
  so_luong_dat = VALUES(so_luong_dat),
  thanh_tien = VALUES(thanh_tien),
  trang_thai_san_pham = VALUES(trang_thai_san_pham);

INSERT INTO thanh_toan (
  id_thanh_toan,
  id_don_hang,
  so_tien,
  phuong_thuc,
  ma_giao_dich,
  trang_thai,
  ngay_thanh_toan
) VALUES
(9001, 9001, 240000.00, 'cod', NULL, 'cho_thanh_toan', NULL),
(9002, 9002, 85000.00, 'chuyen_khoan', NULL, 'cho_thanh_toan', NULL),
(9003, 9003, 120000.00, 'tra_sau', NULL, 'cho_thanh_toan', NULL)
ON DUPLICATE KEY UPDATE
  id_don_hang = VALUES(id_don_hang),
  so_tien = VALUES(so_tien),
  phuong_thuc = VALUES(phuong_thuc),
  ma_giao_dich = VALUES(ma_giao_dich),
  trang_thai = VALUES(trang_thai),
  ngay_thanh_toan = VALUES(ngay_thanh_toan);

INSERT INTO giao_hang (
  id_giao_hang,
  id_don_hang,
  id_nhan_vien_giao,
  trang_thai,
  anh_bien_nhan,
  anh_hop_dong,
  ghi_chu,
  thoi_gian_giao
) VALUES
(
  9001,
  9001,
  9003,
  'cho_giao',
  NULL,
  NULL,
  'Phieu giao hang seed cho don COD',
  NULL
)
ON DUPLICATE KEY UPDATE
  id_don_hang = VALUES(id_don_hang),
  id_nhan_vien_giao = VALUES(id_nhan_vien_giao),
  trang_thai = VALUES(trang_thai),
  anh_bien_nhan = VALUES(anh_bien_nhan),
  anh_hop_dong = VALUES(anh_hop_dong),
  ghi_chu = VALUES(ghi_chu),
  thoi_gian_giao = VALUES(thoi_gian_giao);

INSERT INTO hop_dong (
  id_hop_dong,
  id_don_hang,
  ngay_tao,
  ngay_ky,
  file_hop_dong,
  trang_thai
) VALUES
(
  9001,
  9003,
  NOW(),
  NULL,
  NULL,
  'chua_ky'
)
ON DUPLICATE KEY UPDATE
  id_don_hang = VALUES(id_don_hang),
  ngay_tao = VALUES(ngay_tao),
  ngay_ky = VALUES(ngay_ky),
  file_hop_dong = VALUES(file_hop_dong),
  trang_thai = VALUES(trang_thai);

INSERT INTO gia_han_thanh_toan (
  id_gia_han,
  id_ho_so,
  id_nguoi_gui,
  id_nguoi_duyet,
  han_cu,
  han_de_xuat,
  ly_do,
  ghi_chu,
  trang_thai,
  ngay_gui,
  ngay_duyet
) VALUES
(
  9001,
  9001,
  9002,
  NULL,
  '2026-12-31 23:59:59',
  '2027-01-31 23:59:59',
  'Can them thoi gian xoay vong von',
  'Ban ghi seed de test du lieu gia han',
  'cho_duyet',
  NOW(),
  NULL
)
ON DUPLICATE KEY UPDATE
  id_ho_so = VALUES(id_ho_so),
  id_nguoi_gui = VALUES(id_nguoi_gui),
  id_nguoi_duyet = VALUES(id_nguoi_duyet),
  han_cu = VALUES(han_cu),
  han_de_xuat = VALUES(han_de_xuat),
  ly_do = VALUES(ly_do),
  ghi_chu = VALUES(ghi_chu),
  trang_thai = VALUES(trang_thai),
  ngay_gui = VALUES(ngay_gui),
  ngay_duyet = VALUES(ngay_duyet);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Seed test data completed' AS message;
