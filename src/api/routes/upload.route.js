const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const { uploadController } = require("../controllers");

router.post(
  "/single",
  upload.single("image"),
  uploadController.uploadSingleImage
);

router.post(
  "/multiple",
  upload.array("images", 5),
  uploadController.uploadMultipleImages
);

module.exports = router;