const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split(".").pop().toLowerCase();
    const originalName = file.originalname.replace(/\.[^/.]+$/, "");
    const publicId = `${Date.now()}-${originalName}.${ext}`;

    return {
      folder: "dat-tom/files",
      resource_type: "raw",
      allowed_formats: ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"],
      public_id: publicId,
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