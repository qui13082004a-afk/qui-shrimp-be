const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const uploadRoute = require("./upload.route");
const categoryRoute = require("./category.route");
const productRoute = require("./product.route");
const pondRoute = require("./pond.route");
const cropSeasonRoute =require ("./cropSeason.route");
const customerProfileRoute = require("./customerProfile.route");
const orderRoute = require("./order.route");    
const paymentRoute = require("./payment.route");
const deliveryRoute = require("./delivery.route");
const debtRoutes = require("./debt.route");
const debtExtensionRoute = require("./debtExtension.route");
const notificationRoute = require("./notification.route");
const chinhSachHanMucRoute = require("./chinhSachHanMuc.route");
const phieuDeXuatHanMucRoute = require("./phieuDeXuatHanMuc.route");
const hopDongRoute = require("./hopDong.route");
const khuVucHoTroTraSauRoute = require(
  "./khuVucHoTroTraSau.route"
);
const locationRoute = require("./location.route");
const businessAreaRoute = require("./businessArea.route");
const departurePointRoute = require("./departurePoint.route");
const shippingFeeRoute = require("./shippingFee.route");
const warehouseRoute = require("./warehouse.route");
const limitStaffAreaRoute = require("./limitStaffArea.route");
const deliveryAddressRoute = require("./deliveryAddress.route");
router.use("/delivery-addresses", deliveryAddressRoute);
router.use("/limit-staff-areas", limitStaffAreaRoute);
router.use("/warehouses", warehouseRoute);
router.use("/locations", locationRoute);
router.use("/business-areas", businessAreaRoute);
router.use("/departure-points", departurePointRoute);
router.use("/shipping-fees", shippingFeeRoute);
router.use(
  "/khu-vuc-ho-tro-tra-sau",
  khuVucHoTroTraSauRoute
);
router.use("/hop-dong", hopDongRoute);
router.use("/phieu-de-xuat-han-muc", phieuDeXuatHanMucRoute);
router.use("/chinh-sach-han-muc", chinhSachHanMucRoute);
router.use("/notifications", notificationRoute);
router.use("/auth", authRoute);
router.use("/upload", uploadRoute);
router.use("/categories", categoryRoute);
router.use("/products", productRoute);
router.use("/ponds", pondRoute);
router.use("/crop-seasons", cropSeasonRoute);
router.use("/customer-profiles", customerProfileRoute);
router.use("/orders", orderRoute);
router.use("/payments", paymentRoute);
router.use("/deliveries", deliveryRoute);
router.use("/debts", debtRoutes);
router.use("/debt-extensions", debtExtensionRoute);
module.exports = router;
