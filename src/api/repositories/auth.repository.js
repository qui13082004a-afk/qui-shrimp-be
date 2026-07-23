const { NguoiDung } = require("../models");
const { Op } = require("sequelize");

const findByEmailOrPhone = async (email, so_dien_thoai) => {
  return await NguoiDung.findOne({
    where: {
      [Op.or]: [
        { email },
        { so_dien_thoai },
      ],
    },
  });
};
const findByPk = async (id, options = {}) => {
  return await NguoiDung.findByPk(id, options);
};
const createUser = async (data) => {
  return await NguoiDung.create(data);
};
const updateUnverifiedUser = async (id, data) => {
  return await NguoiDung.update(
    {
      ho_ten: data.ho_ten,
      so_dien_thoai: data.so_dien_thoai,
      dia_chi: data.dia_chi,
      email: data.email,
      mat_khau: data.mat_khau,
      tinh_thanh: data.tinh_thanh,
      otp_code: data.otp_code,
      otp_expires: data.otp_expires,
      trang_thai_tai_khoan: "chua_xac_thuc",
    },
    {
      where: {
        id_nguoi_dung,
      },
    }
  );
};
const findByEmail = async (email) => {
  return await NguoiDung.findOne({ where: { email } });
};

const findById = async (id) => {
  return await NguoiDung.findByPk(id);
};

const findByPhoneExceptUser = async (so_dien_thoai, userId) => {
  return await NguoiDung.findOne({
    where: {
      so_dien_thoai,
      id_nguoi_dung: {
        [Op.ne]: userId,
      },
    },
  });
};
const updateRole = async (id_nguoi_dung, vai_tro) => {
  const user = await NguoiDung.findByPk(id_nguoi_dung);

  if (!user) return null;

  user.vai_tro = vai_tro;
  await user.save();

  return user;
};
const findAllUsers = async ({ search, vai_tro, trang_thai_tai_khoan, page, limit }) => {
  const where = {};

  if (search) {
    where[Op.or] = [
      { ho_ten: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { so_dien_thoai: { [Op.like]: `%${search}%` } },
    ];
  }

  if (vai_tro && vai_tro !== "tat_ca") {
    where.vai_tro = vai_tro;
  }

  if (trang_thai_tai_khoan && trang_thai_tai_khoan !== "tat_ca") {
    where.trang_thai_tai_khoan = trang_thai_tai_khoan;
  }

  return await NguoiDung.findAndCountAll({
    where,
    attributes: {
      exclude: ["mat_khau", "otp_code", "otp_expires"],
    },
    order: [["ngay_tao", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });
};

const findUserSafeById = async (id_nguoi_dung) => {
  return await NguoiDung.findByPk(id_nguoi_dung, {
    attributes: {
      exclude: ["mat_khau", "otp_code", "otp_expires"],
    },
  });
};

const updateStatus = async (id_nguoi_dung, trang_thai_tai_khoan) => {
  const user = await NguoiDung.findByPk(id_nguoi_dung);

  if (!user) return null;

  user.trang_thai_tai_khoan = trang_thai_tai_khoan;
  await user.save();

  user.mat_khau = undefined;
  user.otp_code = undefined;
  user.otp_expires = undefined;

  return user;
};
module.exports = {
  findByEmailOrPhone,
  createUser,
  findByEmail,
  findByPk,
  findById,
  findByPhoneExceptUser,
  updateRole,
  findAllUsers,
  findUserSafeById,
  updateStatus,
  updateUnverifiedUser
};
