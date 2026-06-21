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

module.exports = {
  findByEmailOrPhone,
  createUser,
  findByEmail,
  findByPk,
  findById,
  findByPhoneExceptUser
};
