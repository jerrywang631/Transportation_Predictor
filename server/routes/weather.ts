import { Router } from "express";

const router = Router();

const parseCoordinate = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

router.get("/current", (req, res) => {
  const lat = parseCoordinate(req.query.lat, 43.6532);
  const lng = parseCoordinate(req.query.lng, -79.3832);

  res.json({
    locationName: "Toronto",
    temperatureC: 22,
    feelsLikeC: 24,
    condition: "Cloudy",
    humidity: 68,
    windKph: 14,
    precipitationMm: 0,
    observedAt: new Date().toISOString(),
    coordinates: { lat, lng },
  });
});

router.get("/forecast", (req, res) => {
  const lat = parseCoordinate(req.query.lat, 43.6532);
  const lng = parseCoordinate(req.query.lng, -79.3832);
  const now = Date.now();

  res.json({
    locationName: "Toronto",
    coordinates: { lat, lng },
    hours: Array.from({ length: 6 }, (_, index) => ({
      time: new Date(now + index * 60 * 60 * 1000).toISOString(),
      temperatureC: 22 - Math.floor(index / 3),
      condition: index < 3 ? "Cloudy" : "Light rain",
      precipitationProbability: index < 3 ? 20 : 45,
      windKph: 14 + index,
    })),
  });
});

export default router;
