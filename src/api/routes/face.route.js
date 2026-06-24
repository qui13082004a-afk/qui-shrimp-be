const express = require("express");
const faceController = require("../controllers/face.controller");
const faceUpload = require("../middlewares/face-upload.middleware");

const router = express.Router();

router.post(
  "/register/:id_ho_so",
  faceUpload.fields([
    { name: "cccd_front", maxCount: 1 },
    { name: "cccd_back", maxCount: 1 },
  ]),
  faceController.registerFace
);

router.post(
  "/verify/:id_ho_so",
  faceUpload.single("selfie"),
  faceController.verifyFace
);

module.exports = router;