const authService = require("./auth.service");
const categoryService = require("./category.service");
const productService = require("./product.service");
const pondService = require("./pond.service");
const cropSeasonService=require("./cropSeason.service");
const customerProfileService = require("./customerProfile.service");
const orderService = require("./order.service");
const paymentService = require("./payment.service");
const deliveryService = require("./delivery.service");
const debtExtensionService=require("./debtExtension.service")
const chinhSachHanMucService = require("./chinhSachHanMuc.service");
const phieuDeXuatHanMucService = require("./phieuDeXuatHanMuc.service");
const hopDongService = require("./hopDong.service");
const khuVucHoTroTraSauService = require(
  "./khuVucHoTroTraSau.service"
);
const locationService = require("./location.service");
const businessAreaService = require("./businessArea.service");
const departurePointService = require("./departurePoint.service");
const shippingFeeService = require("./shippingFee.service");
const warehouseService = require("./warehouse.service");
const limitStaffAreaService = require("./limitStaffArea.service");
module.exports = {
  authService,
  categoryService,
  productService,
  pondService,
  cropSeasonService,
  customerProfileService,
  orderService,
  paymentService,
  deliveryService,
  hopDongService,
  debtExtensionService,chinhSachHanMucService,phieuDeXuatHanMucService,
  khuVucHoTroTraSauService,
  locationService,
  businessAreaService,
  departurePointService,
  shippingFeeService,
  warehouseService,
  limitStaffAreaService
}
