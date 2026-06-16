const { productService } = require("../services");
const cloudinary = require("../../config/cloudinary");
const createProduct = async (req, res) => {
  let uploadedPublicIds = [];

  try {
    const imageUrls = req.files ? req.files.map((file) => file.path) : [];

    uploadedPublicIds = req.files
      ? req.files.map((file) => file.filename || file.public_id)
      : [];

    const data = {
      ...req.body,
      hinh_anh: JSON.stringify(imageUrls),
    };

    const product = await productService.createProduct(data);

    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm thành công",
      data: product,
    });
  } catch (error) {
 
    if (uploadedPublicIds.length > 0) {
      await Promise.all(
        uploadedPublicIds.map((publicId) =>
          cloudinary.uploader.destroy(publicId)
        )
      );
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const getActiveProducts = async (req, res) => {
  try {
    const products = await productService.getActiveProducts();

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm thành công",
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await productService.getAllProducts();

    res.status(200).json({
      success: true,
      message: "Lấy tất cả sản phẩm thành công",
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const data = {
      ...req.body,
    };

    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map((file) => file.path);
      data.hinh_anh = JSON.stringify(imageUrls);
    }

    const product = await productService.updateProduct(id, data);

    res.status(200).json({
      success: true,
      message: "Cập nhật sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    await productService.deleteProduct(id);

    res.status(200).json({
      success: true,
      message: "Ẩn sản phẩm thành công",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getActiveProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};