const fs = require("fs");
const path = require("path");

const SOUTHERN_PROVINCE_CODES = new Set([
  "75", // Dong Nai
  "79", // Ho Chi Minh City
  "80", // Tay Ninh
  "82", // Dong Thap 
  "86", // Vinh Long
  "91", // An Giang
  "92", // Can Tho
  "96", // Ca Mau
]);

const projectRoot = path.resolve(__dirname, "..", "..");
const sourcePath = path.join(projectRoot, "ward_boundary_full_34.geojson");
const outputDirectory = path.join(__dirname, "..", "data");
const outputPath = path.join(outputDirectory, "ward_boundary_mien_nam_34.geojson");

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Khong tim thay file nguon: ${sourcePath}`);
}

fs.mkdirSync(outputDirectory, { recursive: true });

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const retainedFeatures = source.features.filter((feature) => {
  const provinceCode = String(feature?.properties?.province_id || "").padStart(2, "0");
  return SOUTHERN_PROVINCE_CODES.has(provinceCode);
});

const output = {
  ...source,
  name: "ward_boundary_mien_nam_34",
  features: retainedFeatures,
};

fs.writeFileSync(outputPath, JSON.stringify(output));

const provinceCounts = retainedFeatures.reduce((counts, feature) => {
  const properties = feature.properties || {};
  const code = String(properties.province_id || "").padStart(2, "0");
  const name = properties.province_name || code;
  counts[`${code} - ${name}`] = (counts[`${code} - ${name}`] || 0) + 1;
  return counts;
}, {});

console.log(`Da tao: ${outputPath}`);
console.log(`So phuong/xa giu lai: ${retainedFeatures.length}`);
console.table(provinceCounts);
