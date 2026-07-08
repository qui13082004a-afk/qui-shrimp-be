const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload.middleware");
const uploadFile = require("../middlewares/uploadFile.middleware"); // thêm import middleware đúng
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

router.post(
  "/file",
  uploadFile.single("file"),   
  uploadController.uploadFile
);

module.exports = router;