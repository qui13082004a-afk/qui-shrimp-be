const { cropSeasonService } = require("../services");

const createCropSeason = async (req, res) => {
  try {
    const cropSeason = await cropSeasonService.createCropSeason(
      req.user.id_nguoi_dung,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Thêm vụ nuôi thành công",
      data: cropSeason,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCropSeasonsByPond = async (req, res) => {
  try {
    const cropSeasons = await cropSeasonService.getCropSeasonsByPond(
      req.user.id_nguoi_dung,
      req.params.id_ao
    );

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách vụ nuôi thành công",
      data: cropSeasons,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getCropSeasonById = async (req, res) => {
  try {
    const cropSeason = await cropSeasonService.getCropSeasonById(
      req.user.id_nguoi_dung,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết vụ nuôi thành công",
      data: cropSeason,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateCropSeason = async (req, res) => {
  try {
    const cropSeason = await cropSeasonService.updateCropSeason(
      req.user.id_nguoi_dung,
      req.params.id,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật vụ nuôi thành công",
      data: cropSeason,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteCropSeason = async (req, res) => {
  try {
    await cropSeasonService.deleteCropSeason(
      req.user.id_nguoi_dung,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Xóa vụ nuôi thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createCropSeason,
  getCropSeasonsByPond,
  getCropSeasonById,
  updateCropSeason,
  deleteCropSeason,
};