ALTER TABLE don_hang
  ADD COLUMN ty_le_phu_phi_tra_sau DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER tong_thanh_toan,
  ADD COLUMN lai_suat_qua_han_thang DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER ty_le_phu_phi_tra_sau;
