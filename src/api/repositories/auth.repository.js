const { NguoiDung } = require("../models");

const findByEmailOrPhone = async (email, so_dien_thoai) => {
  return await NguoiDung.findOne({
    where: {
      [require("sequelize").Op.or]: [
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

module.exports = {
  findByEmailOrPhone,
  createUser,
  findByEmail,
  findByPk
};