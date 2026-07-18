const ADMIN_PREFIX_PATTERN =
  /^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|xa|phuong|thi tran)\s+/i;

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ");

const removeVietnameseTones = (value) =>
  normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeForCompare = (value) =>
  removeVietnameseTones(value)
    .toLowerCase()
    .replace(ADMIN_PREFIX_PATTERN, "")
    .trim();

const cleanAdministrativeName = (value) => {
  const text = normalizeText(value);
  if (!text) return "";

  return text
    .replace(/^(Tỉnh|Thành phố|TP\.?|Quận|Huyện|Thị xã|Xã|Phường|Thị trấn)\s+/i, "")
    .trim();
};

const findProvinceByText = (value, provinces = []) => {
  const normalizedValue = normalizeForCompare(value);
  if (!normalizedValue) return null;

  return (
    provinces.find((province) => {
      const provinceName = normalizeForCompare(province.ten_tinh);
      return (
        normalizedValue === provinceName ||
        normalizedValue.includes(provinceName) ||
        provinceName.includes(normalizedValue)
      );
    }) || null
  );
};

const formatWardName = (ward) => {
  if (!ward) return "";
  const wardName = normalizeText(ward.ten_xa);
  const wardLevel = normalizeText(ward.cap_xa);

  if (!wardName) return "";
  if (!wardLevel) return wardName;

  const normalizedWard = normalizeForCompare(wardName);
  const normalizedLevel = normalizeForCompare(wardLevel);
  return normalizedWard.startsWith(normalizedLevel)
    ? wardName
    : `${wardLevel} ${wardName}`;
};

const buildFullAddress = ({ detail, ward, province }) => {
  const cleanDetail = normalizeText(detail);
  const wardLabel = formatWardName(ward);
  const provinceLabel = province?.ten_tinh || "";

  return [cleanDetail, wardLabel, provinceLabel]
    .filter(Boolean)
    .join(", ");
};

module.exports = {
  normalizeText,
  removeVietnameseTones,
  normalizeForCompare,
  cleanAdministrativeName,
  findProvinceByText,
  formatWardName,
  buildFullAddress,
};
