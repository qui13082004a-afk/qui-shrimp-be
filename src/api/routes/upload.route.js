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
router.post(
  "/file",
  upload.single("file"),
  uploadController.uploadFile
);
module.exports = router;