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
  deliveryController
};