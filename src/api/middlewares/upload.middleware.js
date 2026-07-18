const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getExtension = (fileName = "") => {
  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dat-tom",
    allowed_formats: IMAGE_EXTENSIONS,
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = getExtension(file.originalname);

    if (
      !IMAGE_MIME_TYPES.includes(file.mimetype) ||
      !IMAGE_EXTENSIONS.includes(extension)
    ) {
      const error = new Error("File upload phải là ảnh jpg, jpeg, png hoặc webp");
      error.status = 400;
      error.field = file.fieldname;
      return cb(error);
    }

    return cb(null, true);
  },
});

module.exports = upload;
