const multer = require("multer");

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

const privateFileUpload = multer({
  storage: multer.memoryStorage(),
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
        "File upload phai la pdf, doc, docx, jpg, jpeg, png hoac webp"
      );
      error.status = 400;
      error.field = file.fieldname;
      return cb(error);
    }

    return cb(null, true);
  },
});

module.exports = privateFileUpload;
