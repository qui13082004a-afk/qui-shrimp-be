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
        : path.resolve(
          process.cwd(),
          process.env.WARD_BOUNDARY_GEOJSON_PATH
        )
    );
  }

  candidates.push(
    path.resolve(
      process.cwd(),
      "data",
      "ward_boundary_mien_nam_34.geojson"
    )
  );
  return candidates;
};

const loadBoundaryGeoJson = async () => {
  // Duyệt từng đường dẫn
  for (const filePath of resolveBoundaryPathCandidates()) {
    // Nếu file tồn tại
    if (fs.existsSync(filePath)) {
      return JSON.parse(
        fs.readFileSync(filePath, "utf8")
      );
    }
  }
  // Nếu không có file local thì thử tải từ URL
  if (process.env.WARD_BOUNDARY_GEOJSON_URL) {
    const response = await fetch(
      process.env.WARD_BOUNDARY_GEOJSON_URL
    );
    if (!response.ok) {
      throw new Error(
        `Khong tai duoc file ward_boundary_full_34.geojson tu WARD_BOUNDARY_GEOJSON_URL (${response.status})`
      );
    }

    return await response.json();
  }
  // Không tìm thấy file
  throw new Error(
    "Chua tim thay file ward_boundary_full_34.geojson"
  );
};
// Hàm đệ quy dùng để duyệt toàn bộ các cặp tọa độ
// trong Polygon hoặc MultiPolygon.
const walkCoordinatePairs = (coordinates, callback) => {
  // Không phải mảng thì dừng
  if (!Array.isArray(coordinates)) return;
  // Nếu đã gặp một cặp tọa độ [kinh_do, vi_do]
  if (
    coordinates.length >= 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  ) {
    // Gọi callback
    callback(coordinates[0], coordinates[1]);
    return;
  }
  // Nếu chưa phải cặp tọa độ thì tiếp tục đệ quy
  coordinates.forEach((item) =>
    walkCoordinatePairs(item, callback)
  );
};
// Bounding Box là hình chữ nhật nhỏ nhất bao quanh Polygon.
// Dùng để lọc nhanh trước khi kiểm tra Polygon.
const getBbox = (geometry) => {

  const bbox = {
    minLon: Infinity,
    minLat: Infinity,
    maxLon: -Infinity,
    maxLat: -Infinity,
  };
  // Duyệt tất cả điểm
  walkCoordinatePairs(
    geometry.coordinates,
    (lon, lat) => {
      // Cập nhật giá trị nhỏ nhất và lớn nhất
    bbox.minLon = Math.min(bbox.minLon, lon);
    bbox.minLat = Math.min(bbox.minLat, lat);
    bbox.maxLon = Math.max(bbox.maxLon, lon);
    bbox.maxLat = Math.max(bbox.maxLat, lat);
    }
  );

  return bbox;
};

// kiểm tra Bounding Box
const isPointInBbox = (lon, lat, bbox) => {

  return (
    lon >= bbox.minLon &&
    lon <= bbox.maxLon &&
    lat >= bbox.minLat &&
    lat <= bbox.maxLat
  );
};

// Thuật toán Point In Polygon.
const isPointInRing = (lon, lat, ring) => {
  // Ban đầu giả sử điểm nằm ngoài
  let inside = false;
  // Duyệt từng cạnh của Polygon
  for (
    let i = 0, j = ring.length - 1;i < ring.length;j = i++
  ) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    // Kiểm tra tia ngang có cắt cạnh không
    const intersects =
      yi > lat !== yj > lat &&
      lon <
      ((xj - xi) * (lat - yi)) /
      (yj - yi || Number.EPSILON) +
      xi;
    // Nếu cắt thì đảo trạng thái
    if (intersects) inside = !inside;
  }

  return inside;
};

const isPointInPolygon = (lon, lat, polygon) => {
  // polygon[0] là đường bao ngoài
  if (
    !polygon.length ||
    !isPointInRing(lon, lat, polygon[0])
  ) {
    return false;
  }
  // Nếu điểm nằm trong hole thì không hợp lệ
  for (let i = 1; i < polygon.length; i++) {

    if (isPointInRing(lon, lat, polygon[i])) {
      return false;
    }
  }

  return true;
};

const isPointInGeometry = (lon, lat, geometry) => {
  if (!geometry) return false;

  if (geometry.type === "Polygon") {
    return isPointInPolygon(
      lon,
      lat,
      geometry.coordinates
    );
  }
  // Nếu là MultiPolygon
  if (geometry.type === "MultiPolygon") {
    // Chỉ cần thuộc 1 Polygon là hợp lệ
    return geometry.coordinates.some((polygon) =>
      isPointInPolygon(lon, lat, polygon)
    );
  }

  return false;
};

const loadBoundaryCache = async () => {
  if (boundaryCache) return boundaryCache;

  const geojson = await loadBoundaryGeoJson();
  // Chỉ giữ lại dữ liệu cần dùng
  boundaryCache = geojson.features.map((feature) => ({
    // Thông tin xã/phường
    properties: feature.properties,
    // Đường bao Polygon
    geometry: feature.geometry,
    // Bounding Box để tăng tốc tìm kiếm
    bbox: getBbox(feature.geometry),
  }));

  return boundaryCache;
};
const resolveCoordinate = async ({
  vi_do,
  kinh_do,
}) => {

  // Chuyển sang Number
  const lat = Number(vi_do);
  const lon = Number(kinh_do);
  // Kiểm tra vĩ độ
  if (
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90
  ) {
    throw new Error("Vi do khong hop le");
  }
  // Kiểm tra kinh độ
  if (
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    throw new Error("Kinh do khong hop le");
  }
  // Load cache
  const boundaries = await loadBoundaryCache();
  // Tìm Polygon phù hợp
  const matched = boundaries.find((item) => {
    return (
      // Kiểm tra Bounding Box trước
      isPointInBbox(lon, lat, item.bbox)
      // Kiểm tra Polygon chính xác
      && isPointInGeometry(
        lon,
        lat,
        item.geometry
      )
    );
  });
  // Không tìm thấy
  if (!matched) {
    return {
      tim_thay: false,
      vi_do: lat,
      kinh_do: lon,
      dia_gioi: null,
    };
  }
  // Lấy thông tin hành chính
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
