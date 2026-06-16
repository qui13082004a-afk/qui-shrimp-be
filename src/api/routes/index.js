const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const uploadRoute = require("./upload.route");
const categoryRoute = require("./category.route");
const productRoute = require("./product.route");
const pondRoute = require("./pond.route");
router.use("/auth", authRoute);
router.use("/upload", uploadRoute);
router.use("/categories", categoryRoute);
router.use("/products", productRoute);
router.use("/ponds", pondRoute);
module.exports = router;