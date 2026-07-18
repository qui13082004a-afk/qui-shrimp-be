const { locationService } = require("../services");

const importAdministrativeUnits = async (req, res) => {
  try {
    const result = await locationService.importAdministrativeUnits(
      req.user,
      req.body.file_path
    );

    return res.status(200).json({
      success: true,
      message: "Import du lieu tinh/thanh va phuong/xa thanh cong",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllProvinces = async (req, res) => {
  try {
    const provinces = await locationService.getAllProvinces();
    return res.status(200).json({
      success: true,
      message: "Lay danh sach tinh/thanh thanh cong",
      data: provinces,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getWardsByProvinceId = async (req, res) => {
  try {
    const wards = await locationService.getWardsByProvinceId(
      req.params.id_tinh_thanh
    );
    return res.status(200).json({
      success: true,
      message: "Lay danh sach phuong/xa thanh cong",
      data: wards,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const resolveCoordinate = async (req, res) => {
  try {
    const result = await locationService.resolveCoordinate(req.body);
    return res.status(200).json({
      success: true,
      message: result.tim_thay
        ? "Tim thay dia gioi theo toa do"
        : "Khong tim thay dia gioi theo toa do",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  importAdministrativeUnits,
  getAllProvinces,
  getWardsByProvinceId,
  resolveCoordinate,
};
