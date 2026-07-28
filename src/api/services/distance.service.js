const toNumber = (value, fieldName) => {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`${fieldName} khong hop le`);
  }
  return number;
};

const toRadians = (degree) => degree * Math.PI / 180;

// Tinh khoang cach duong chim bay giua hai diem bang cong thuc Haversine.
const calculateHaversineKm = (from, to) => {
  const fromLat = toNumber(from.vi_do, "Vi do diem xuat phat");
  const fromLon = toNumber(from.kinh_do, "Kinh do diem xuat phat");
  const toLat = toNumber(to.vi_do, "Vi do diem den");
  const toLon = toNumber(to.kinh_do, "Kinh do diem den");

  if (fromLat < -90 || fromLat > 90 || toLat < -90 || toLat > 90) {
    throw new Error("Vi do phai nam trong khoang -90 den 90");
  }
  if (fromLon < -180 || fromLon > 180 || toLon < -180 || toLon > 180) {
    throw new Error("Kinh do phai nam trong khoang -180 den 180");
  }

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(toLat - fromLat);
  const deltaLon = toRadians(toLon - fromLon);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(2));
};

// Hien tai he thong luon tinh bang Haversine.
// Truong provider duoc tra ve de du phong mo rong sang API ban do sau nay.
const calculateDistanceKm = async (from, to) => {
  return {
    distance_km: calculateHaversineKm(from, to),
    provider: process.env.GOOGLE_ROUTES_API_KEY ? "haversine_fallback" : "haversine",
  };
};

module.exports = {
  calculateDistanceKm,
  calculateHaversineKm,
};
