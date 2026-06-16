const authService = require("./auth.service");
const categoryService = require("./category.service");
const productService = require("./product.service");
const pondService = require("./pond.service");
const cropSeasonService=require("./cropSeason.service");
const customerProfileService = require("./customerProfile.service");
const orderService = require("./order.service");
const paymentService = require("./payment.service");
module.exports = {
  authService,
  categoryService,
  productService,
  pondService,
  cropSeasonService,
  customerProfileService,
  orderService,
  paymentService,
};
