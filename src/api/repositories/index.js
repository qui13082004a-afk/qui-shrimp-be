const authRepository = require("./auth.repository");
const categoryRepository = require("./category.repository");
const productRepository = require("./product.repository");
const pondRepository = require("./pond.repository");
const cropSeasonRepository = require("./cropSeason.repository");
const customerProfileRepository = require("./customerProfile.repository");
const orderRepository = require("./order.repository");
const paymentRepository = require("./payment.repository");
const deliveryRepository = require("./delivery.repository");
const debtExtensionRepository = require("./debtExtension.repository");
const notificationRepository = require( "./notification.repository")
module.exports = {
  authRepository,
  categoryRepository,
  productRepository,
  pondRepository,
  cropSeasonRepository,
  customerProfileRepository,
  orderRepository,
  paymentRepository,
  deliveryRepository,
  debtExtensionRepository,
  notificationRepository
};
  