const deliveryAddressService = require("../services/deliveryAddress.service");

const getMyAddresses = async (req, res) => {
  try {
    const addresses = await deliveryAddressService.getMyAddresses(req.user);
    return res.status(200).json({
      success: true,
      message: "Lay danh sach dia chi giao hang thanh cong",
      data: addresses,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const createMyAddress = async (req, res) => {
  try {
    const address = await deliveryAddressService.createMyAddress(
      req.user,
      req.body
    );
    return res.status(201).json({
      success: true,
      message: "Them dia chi giao hang thanh cong",
      data: address,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const updateMyAddress = async (req, res) => {
  try {
    const address = await deliveryAddressService.updateMyAddress(
      req.user,
      req.params.id,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: "Cap nhat dia chi giao hang thanh cong",
      data: address,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const address = await deliveryAddressService.setDefaultAddress(
      req.user,
      req.params.id
    );
    return res.status(200).json({
      success: true,
      message: "Dat dia chi mac dinh thanh cong",
      data: address,
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteMyAddress = async (req, res) => {
  try {
    await deliveryAddressService.deleteMyAddress(req.user, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Xoa dia chi giao hang thanh cong",
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyAddresses,
  createMyAddress,
  updateMyAddress,
  setDefaultAddress,
  deleteMyAddress,
};
