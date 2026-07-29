const crypto = require("crypto");

// Dung AES-256-GCM de ma hoa 2 chieu va co kiem tra tinh toan ven du lieu.
const ALGORITHM = "aes-256-gcm";

// Tien to giup nhan biet chuoi nao da duoc ma hoa.
const PREFIX = "enc:v1:";

// GCM thuong dung IV 12 bytes de dam bao an toan va hieu nang tot.
const IV_LENGTH = 12;

// Tao khoa 32 bytes cho AES-256 tu bien moi truong.
const getEncryptionKey = () => {
  const secret =
    process.env.CUSTOMER_PROFILE_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "Missing CUSTOMER_PROFILE_ENCRYPTION_KEY or JWT_SECRET for encryption"
    );
  }

  return crypto.createHash("sha256").update(String(secret)).digest();
};

// Kiem tra du lieu da duoc ma hoa chua de tranh ma hoa lap lai.
const isEncryptedText = (value) =>
  typeof value === "string" && value.startsWith(PREFIX);

// Ma hoa mot gia tri truoc khi luu vao database.
const encryptText = (value) => {
  // Giu nguyen gia tri rong de khong lam sai nghiep vu allowNull.
  if (value === null || value === undefined || value === "") return value;

  const text = String(value);
  if (isEncryptedText(text)) return text;

  // Moi lan ma hoa tao IV moi nen cung mot noi dung van ra chuoi khac nhau.
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Luu thanh 1 chuoi de de dua vao cac cot TEXT trong MySQL.
  return [
    PREFIX.slice(0, -1),
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

// Giai ma mot gia tri khi lay tu database ra.
const decryptText = (value) => {
  // Du lieu cu chua ma hoa se duoc tra ve nguyen ban.
  if (!isEncryptedText(value)) return value;

  try {
    const [, , ivText, tagText, encryptedText] = value.split(":");
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getEncryptionKey(),
      Buffer.from(ivText, "base64")
    );

    // Auth tag giup phat hien sai key hoac chuoi bi sua.
    decipher.setAuthTag(Buffer.from(tagText, "base64"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedText, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    // Khong lam sap API neu gap du lieu cu/sai key; tra ve chuoi goc de de debug.
    console.error("DECRYPT_TEXT_ERROR:", error.message);
    return value;
  }
};

// Ma hoa cac field nhay cam trong mot object.
const encryptFields = (data, fields) => {
  const result = { ...data };

  fields.forEach((field) => {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encryptText(result[field]);
    }
  });

  return result;
};

// Giai ma cac field nhay cam trong mot object.
const decryptFields = (data, fields) => {
  const result = { ...data };

  fields.forEach((field) => {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = decryptText(result[field]);
    }
  });
  return result;
};

module.exports = {
  encryptText,
  decryptText,
  encryptFields,
  decryptFields,
  isEncryptedText,
};
