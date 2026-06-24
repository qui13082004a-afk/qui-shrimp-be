const multer = require("multer");

const faceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Chỉ cho phép ảnh jpg, jpeg, png, webp"));
    }

    cb(null, true);
  },
});

module.exports = faceUpload;