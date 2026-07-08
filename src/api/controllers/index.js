const authController = require("./auth.controller");
const uploadController = require("./upload.controller");
const categoryController = require("./category.controller");
const productController = require("./product.controller");
const pondController = require("./pond.controller");
const cropSeasonController= require("./cropSeason.controller");
const customerProfileController = require("./customerProfile.controller");
const orderController = require("./order.controller");
const paymentController = require("./payment.controller");
const deliveryController = require("./delivery.controller");
const debtExtensionController=require("./debtExtension.controller");
const blogController = require("./blog.controller");
const commentController = require("./comment.controller");
const chinhSachHanMucController = require("./chinhSachHanMuc.controller");
const phieuDeXuatHanMucController = require("./phieuDeXuatHanMuc.controller");
const hopDongController = require("./hopDong.controller");
const thuongLaiController = require("./thuongLai.controller");
const thoaThuanBaBenController = require("./thoaThuanBaBen.controller");
module.exports = {
  authController,
  uploadController,
  categoryController,
  productController,
  pondController,
  cropSeasonController,
  customerProfileController,
  orderController,
  paymentController,
  deliveryController,
  debtExtensionController,
  blogController,chinhSachHanMucController,
  commentController,
  phieuDeXuatHanMucController,
  hopDongController,
  thuongLaiController,thoaThuanBaBenController,
};