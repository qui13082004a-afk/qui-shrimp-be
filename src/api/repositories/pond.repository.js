const { AoNuoi, VuNuoi, TinhThanh, PhuongXa } = require("../models");

const create = (data) => {
  return AoNuoi.create(data);
};

/**
 * Lấy danh sách ao nuôi của một người dùng.
 */
const findByUserId = async (id_nguoi_dung) => {
  const ponds = await AoNuoi.findAll({
    where: { id_nguoi_dung },

    include: [
      {
        model: TinhThanh,
        required: false,
        attributes: ["id_tinh_thanh", "ma_tinh", "ten_tinh"],
      },
      {
        model: PhuongXa,
        required: false,
        attributes: [
          "id_phuong_xa",
          "ma_xa",
          "ten_xa",
          "cap_xa",
          "vi_do_trung_tam",
          "kinh_do_trung_tam",
        ],
      },
      {
        model: VuNuoi,
        // required: false tương đương LEFT JOIN.
        required: false,
        // Chỉ lấy field cần thiết để giảm dữ liệu trả về.
        attributes: ["id_vu_nuoi", "trang_thai"],
        // Chỉ join các vụ nuôi đang hoạt động.
        where: {
          trang_thai: "dang_nuoi",
        },
      },
    ],
    order: [["id_ao", "DESC"]],
  });
  return ponds.map((pond) => {
    const plain = pond.toJSON();
    return {
      ...plain,
      // Không trả mảng VuNuois về frontend vì frontend chỉ cần biết có vụ đang nuôi hay không.
      VuNuois: undefined,
      // Nếu mảng VuNuois có phần tử => ao này đang có vụ nuôi hoạt động.
      co_vu_dang_nuoi:
        Array.isArray(plain.VuNuois) && plain.VuNuois.length > 0,
    };
  });
};

/**
 * Tìm ao nuôi theo ID.
 */
const findById = (id_ao) => {
  return AoNuoi.findByPk(id_ao, {
    include: [
      {
        model: TinhThanh,
        required: false,
        attributes: ["id_tinh_thanh", "ma_tinh", "ten_tinh"],
      },
      {
        model: PhuongXa,
        required: false,
        attributes: [
          "id_phuong_xa",
          "ma_xa",
          "ten_xa",
          "cap_xa",
          "vi_do_trung_tam",
          "kinh_do_trung_tam",
        ],
      },
    ],
  });
};

/**
 * Cập nhật thông tin ao nuôi.
 */
const update = async (id_ao, data) => {
  const pond = await AoNuoi.findByPk(id_ao);

  if (!pond) return null;

  await pond.update(data);

  return pond;
};

/**
 * Xóa ao nuôi khỏi hệ thống.
 */
const remove = async (id_ao) => {
  const pond = await AoNuoi.findByPk(id_ao);

  if (!pond) return null;

  await pond.destroy();

  return pond;
};

module.exports = {
  create,
  findByUserId,
  findById,
  update,
  remove,
};
