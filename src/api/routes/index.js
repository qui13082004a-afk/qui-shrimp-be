const express = require("express");
const router = express.Router();

const authRoute = require("./auth.route");
const uploadRoute = require("./upload.route");
const categoryRoute = require("./category.route");
const productRoute = require("./product.route");
const pondRoute = require("./pond.route");
const cropSeasonRoute =require ("./cropSeason.route")
router.use("/auth", authRoute);
router.use("/upload", uploadRoute);
router.use("/categories", categoryRoute);
router.use("/products", productRoute);
router.use("/ponds", pondRoute);
router.use("/crop-seasons", cropSeasonRoute);

module.exports = router;