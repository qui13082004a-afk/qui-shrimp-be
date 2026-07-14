const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const FILE_EXTENSIONS = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "webp"];
const FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const getExtension = (fileName = "") => {
  const parts = String(fileName).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const sanitizeFileName = (fileName = "") => {
  return String(fileName)
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
};

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = getExtension(file.originalname);
    const originalName = sanitizeFileName(file.originalname) || "file";
    const publicId = `${Date.now()}-${originalName}.${ext}`;

    return {
      folder: "dat-tom/files",
      resource_type: "raw",
      allowed_formats: FILE_EXTENSIONS,
      public_id: publicId,
    };
  },
});

const uploadFile = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const extension = getExtension(file.originalname);

    if (
      !FILE_MIME_TYPES.includes(file.mimetype) ||
      !FILE_EXTENSIONS.includes(extension)
    ) {
      const error = new Error(
        "File upload phải là pdf, doc, docx, jpg, jpeg, png hoặc webp"
      );
      error.status = 400;
      error.field = file.fieldname;
      return cb(error);
    }

    return cb(null, true);
  },
});

module.exports = uploadFile;
