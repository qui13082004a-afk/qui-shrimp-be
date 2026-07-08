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
const chinhSachHanMucRepository = require("./chinhSachHanMuc.repository");
const phieuDeXuatHanMucRepository = require("./phieuDeXuatHanMuc.repository");
const hopDongRepository = require("./hopDong.repository");
const thuongLaiRepository = require("./thuongLai.repository");
const thoaThuanBaBenRepository = require("./thoaThuanBaBen.repository");
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
  notificationRepository,
  chinhSachHanMucRepository,phieuDeXuatHanMucRepository,
  hopDongRepository,thuongLaiRepository,thoaThuanBaBenRepository
};
  