const authValidators = require("./auth.validate");
const categoryValidators = require("./category.validate");
const productValidators = require("./product.validate");
const pondValidators = require("./pond.validate");
const cropSeasonValidators = require("./cropSeason.validate");
const customerProfileValidators = require("./customerProfile.validate");
const orderValidators = require("./order.validate");
const paymentValidators = require("./payment.validate");
const deliveryValidators = require("./delivery.validate");

module.exports = {
  ...authValidators,
  ...categoryValidators,
  ...productValidators,
  ...pondValidators,
  ...cropSeasonValidators,
  ...customerProfileValidators,
  ...orderValidators,
  ...paymentValidators,
  ...deliveryValidators,
};