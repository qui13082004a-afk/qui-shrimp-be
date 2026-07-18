const fs = require("fs");
const path = require("path");

let boundaryCache = null;

const normalizeCode = (value) => String(value || "").replace(/^0+/, "") || "0";

const resolveBoundaryPathCandidates = () => {
  const candidates = [];

  if (process.env.WARD_BOUNDARY_GEOJSON_PATH) {
    candidates.push(
      path.isAbsolute(process.env.WARD_BOUNDARY_GEOJSON_PATH)
        ? process.env.WARD_BOUNDARY_GEOJSON_PATH
        : path.resolve(process.cwd(), process.env.WARD_BOUNDARY_GEOJSON_PATH)
    );
  }

  candidates.push(
    path.resolve(process.cwd(), "data", "ward_boundary_full_34.geojson"),
    path.resolve(process.cwd(), "src", "data", "ward_boundary_full_34.geojson"),
    path.resolve(process.cwd(), "ward_boundary_full_34.geojson"),
    path.resolve(process.cwd(), "..", "ward_boundary_full_34.geojson")
  );

  return candidates;
};

const loadBoundaryGeoJson = async () => {
  for (const filePath of resolveBoundaryPathCandidates()) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  }

  if (process.env.WARD_BOUNDARY_GEOJSON_URL) {
    const response = await fetch(process.env.WARD_BOUNDARY_GEOJSON_URL);

    if (!response.ok) {
      throw new Error(
        `Khong tai duoc file ward_boundary_full_34.geojson tu WARD_BOUNDARY_GEOJSON_URL (${response.status})`
      );
    }

    return await response.json();
  }

  throw new Error(
    "Chua tim thay file ward_boundary_full_34.geojson. Hay dat file trong BE/data hoac cau hinh WARD_BOUNDARY_GEOJSON_URL tren server deploy."
  );
};

const walkCoordinatePairs = (coordinates, callback) => {
  if (!Array.isArray(coordinates)) return;
  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    callback(coordinates[0], coordinates[1]);
    return;
  }

  coordinates.forEach((item) => walkCoordinatePairs(item, callback));
};

const getBbox = (geometry) => {
  const bbox = {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity,
  };

  walkCoordinatePairs(geometry.coordinates, (lon, lat) => {
    bbox.minLon = Math.min(bbox.minLon, lon);
    bbox.minLat = Math.min(bbox.minLat, lat);
    bbox.maxLon = Math.max(bbox.maxLon, lon);
    bbox.maxLat = Math.max(bbox.maxLat, lat);
  });

  return bbox;
};

const isPointInBbox = (lon, lat, bbox) => {
  return lon >= bbox.minLon && lon <= bbox.maxLon && lat >= bbox.minLat && lat <= bbox.maxLat;
};

const isPointInRing = (lon, lat, ring) => {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
};

const isPointInPolygon = (lon, lat, polygon) => {
  if (!polygon.length || !isPointInRing(lon, lat, polygon[0])) return false;

  for (let i = 1; i < polygon.length; i += 1) {
    if (isPointInRing(lon, lat, polygon[i])) return false;
  }

  return true;
};

const isPointInGeometry = (lon, lat, geometry) => {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return isPointInPolygon(lon, lat, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => isPointInPolygon(lon, lat, polygon));
  }

  return false;
};

const loadBoundaryCache = async () => {
  if (boundaryCache) return boundaryCache;

  const geojson = await loadBoundaryGeoJson();
  boundaryCache = geojson.features.map((feature) => ({
    properties: feature.properties,
    geometry: feature.geometry,
    bbox: getBbox(feature.geometry),
  }));

  return boundaryCache;
};

const resolveCoordinate = async ({ vi_do, kinh_do }) => {
  const lat = Number(vi_do);
  const lon = Number(kinh_do);

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error("Vi do khong hop le");
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    throw new Error("Kinh do khong hop le");
  }

  const boundaries = await loadBoundaryCache();
  const matched = boundaries.find((item) => {
    return isPointInBbox(lon, lat, item.bbox) && isPointInGeometry(lon, lat, item.geometry);
  });

  if (!matched) {
    return {
      tim_thay: false,
      vi_do: lat,
      kinh_do: lon,
      dia_gioi: null,
    };
  }

  const props = matched.properties || {};

  return {
    tim_thay: true,
    vi_do: lat,
    kinh_do: lon,
    dia_gioi: {
      ma_xa_goc: props.ward_id,
      ma_xa: normalizeCode(props.ward_id),
      ten_xa: props.ward_name,
      cap_xa: props.ward_level,
      ma_tinh_goc: props.province_id,
      ma_tinh: normalizeCode(props.province_id),
      ten_tinh: props.province_name,
      vi_do_trung_tam: props.lat,
      kinh_do_trung_tam: props.lon,
    },
  };
};

module.exports = {
  resolveCoordinate,
};
