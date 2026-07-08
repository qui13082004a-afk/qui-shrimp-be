const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "dat-tom/files",
      resource_type: "raw",
    allowed_formats: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"],
    };
  },
});

const uploadFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

module.exports = uploadFile;