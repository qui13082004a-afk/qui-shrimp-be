const path = require("path");
const xlsx = require("xlsx");
const { locationRepository } = require("../repositories");
const boundaryLookupService = require("./boundaryLookup.service");

const REQUIRED_COLUMNS = [
  "ward_id",
  "ward_name",
  "ward_level",
  "province_id",
  "province_name",
  "lat",
  "lon",
];

const IMPORT_BATCH_SIZE = 500;

const validateAdmin = (user) => {
  if (!user || user.vai_tro !== "admin") {
    throw new Error("Chi Admin moi co quyen import du lieu hanh chinh");
  }
};

const normalizeText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const normalizeCode = (value) => {
  const code = normalizeText(value);
  if (!code) throw new Error("Ma hanh chinh khong duoc de trong");
  return code.replace(/\.0$/, "");
};

const toCoordinate = (value, fieldName, min, max) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const resolveExcelPath = (filePath) => {
  if (filePath) {
    return path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);
  }
  return path.resolve(process.cwd(), "..", "ward_centroid_full_34.xlsx");
};

const readRowsFromExcel = (filePath) => {
  const workbook = xlsx.readFile(resolveExcelPath(filePath), {
    cellDates: false,
  });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  const headers = Object.keys(rows[0] || {});
  const missingColumns = REQUIRED_COLUMNS.filter((column) => !headers.includes(column));
  if (missingColumns.length) {
    throw new Error(`File Excel thieu cot: ${missingColumns.join(", ")}`);
  }

  return { sheetName, rows };
};

const importAdministrativeUnits = async (user, filePath) => {
  validateAdmin(user);

  const { sheetName, rows } = readRowsFromExcel(filePath);
  const provinceDataMap = new Map();
  const wardCodes = new Set();
  const normalizedRows = rows.map((row) => {
    const maTinh = normalizeCode(row.province_id);
    const tenTinh = normalizeText(row.province_name);
    const maXa = normalizeCode(row.ward_id);
    const tenXa = normalizeText(row.ward_name);
    const capXa = normalizeText(row.ward_level);
    const viDo = toCoordinate(row.lat, "Vi do", -90, 90);
    const kinhDo = toCoordinate(row.lon, "Kinh do", -180, 180);

    if (!tenTinh || !tenXa || !capXa) {
      throw new Error("File Excel co dong thieu ten tinh, ten xa hoac cap xa");
    }
    if (wardCodes.has(maXa)) {
      throw new Error(`Ma xa bi trung trong file Excel: ${maXa}`);
    }

    wardCodes.add(maXa);
    provinceDataMap.set(maTinh, {
      ma_tinh: maTinh,
      ten_tinh: tenTinh,
    });

    return {
      ma_tinh: maTinh,
      ma_xa: maXa,
      ten_xa: tenXa,
      cap_xa: capXa,
      vi_do_trung_tam: viDo,
      kinh_do_trung_tam: kinhDo,
    };
  });

  const provinceItems = Array.from(provinceDataMap.values());
  const wardCodeList = Array.from(wardCodes);
  const existingWardCount = await locationRepository.countWardsByCodes(wardCodeList);

  if (existingWardCount === normalizedRows.length) {
    return {
      sheet_name: sheetName,
      so_tinh_thanh: provinceItems.length,
      so_phuong_xa: normalizedRows.length,
      da_import_truoc_do: true,
    };
  }

  await locationRepository.bulkUpsertProvinces(provinceItems);

  const provinces = await locationRepository.findProvincesByCodes(
    provinceItems.map((item) => item.ma_tinh)
  );
  const provinceIdByCode = new Map(
    provinces.map((province) => [province.ma_tinh, province.id_tinh_thanh])
  );

  const wardItems = normalizedRows.map((row) => {
    const provinceId = provinceIdByCode.get(row.ma_tinh);
    if (!provinceId) {
      throw new Error(`Khong tim thay tinh/thanh sau khi import: ${row.ma_tinh}`);
    }

    return {
      ma_xa: row.ma_xa,
      ten_xa: row.ten_xa,
      cap_xa: row.cap_xa,
      id_tinh_thanh: provinceId,
      vi_do_trung_tam: row.vi_do_trung_tam,
      kinh_do_trung_tam: row.kinh_do_trung_tam,
    };
  });

  for (let index = 0; index < wardItems.length; index += IMPORT_BATCH_SIZE) {
    const batch = wardItems.slice(index, index + IMPORT_BATCH_SIZE);
    await locationRepository.bulkUpsertWards(batch);
  }

  return {
    sheet_name: sheetName,
    so_tinh_thanh: provinceItems.length,
    so_phuong_xa: wardItems.length,
    da_import_truoc_do: false,
  };
};

const getAllProvinces = async () => {
  return await locationRepository.findAllProvinces();
};

const getWardsByProvinceId = async (id_tinh_thanh) => {
  const province = await locationRepository.findProvinceById(id_tinh_thanh);
  if (!province) throw new Error("Khong tim thay tinh/thanh");
  return await locationRepository.findWardsByProvinceId(id_tinh_thanh);
};

const resolveCoordinate = async (data) => {
  return boundaryLookupService.resolveCoordinate(data);
};

module.exports = {
  importAdministrativeUnits,
  getAllProvinces,
  getWardsByProvinceId,
  resolveCoordinate,
};
