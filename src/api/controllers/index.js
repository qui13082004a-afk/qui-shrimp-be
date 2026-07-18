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
const chinhSachHanMucController = require("./chinhSachHanMuc.controller");
const phieuDeXuatHanMucController = require("./phieuDeXuatHanMuc.controller");
const hopDongController = require("./hopDong.controller");
const thuongLaiController = require("./thuongLai.controller");
const khuVucHoTroTraSauController = require(
  "./khuVucHoTroTraSau.controller"
);
const locationController = require("./location.controller");
const businessAreaController = require("./businessArea.controller");
const departurePointController = require("./departurePoint.controller");
const shippingFeeController = require("./shippingFee.controller");
const warehouseController = require("./warehouse.controller");
const limitStaffAreaController = require("./limitStaffArea.controller");
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
  chinhSachHanMucController,
  phieuDeXuatHanMucController,
  hopDongController,
  thuongLaiController,
  khuVucHoTroTraSauController,
  locationController,
  businessAreaController,
  departurePointController,
  shippingFeeController,
  warehouseController,
  limitStaffAreaController
};
