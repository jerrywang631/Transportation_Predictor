import { Router } from "express";

import {
  getBusReport,
  getNavigationRoute,
  getNearbyStops,
  getPrediction,
  getStopMeta,
  searchDestinations,
  searchStops,
} from "../services/ttcService";

const router = Router();

const parseNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

router.get("/stops/search", (req, res) => {
  res.json(searchStops(String(req.query.q ?? "")));
});

router.get("/destinations/search", (req, res) => {
  res.json(searchDestinations(String(req.query.q ?? "")));
});

router.get("/stops/nearby", (req, res) => {
  const lat = parseNumber(req.query.lat);
  const lng = parseNumber(req.query.lng);

  res.json(getNearbyStops(lat, lng));
});

router.get("/stops/:stopId", (req, res, next) => {
  try {
    res.json(getStopMeta(req.params.stopId));
  } catch (error) {
    next(error);
  }
});

router.get("/prediction", (req, res, next) => {
  try {
    res.json(
      getPrediction(
        String(req.query.stopId ?? ""),
        parseNumber(req.query.routeId),
        String(req.query.direction ?? ""),
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/bus-report", (req, res, next) => {
  try {
    res.json(
      getBusReport(
        String(req.query.stopId ?? ""),
        parseNumber(req.query.routeId),
        String(req.query.direction ?? ""),
      ),
    );
  } catch (error) {
    next(error);
  }
});

router.get("/navigation", (req, res, next) => {
  try {
    const originLat = Number(req.query.originLat);
    const originLng = Number(req.query.originLng);
    const originCoordinates =
      Number.isFinite(originLat) && Number.isFinite(originLng)
        ? { lat: originLat, lng: originLng }
        : undefined;

    res.json(
      getNavigationRoute(
        String(req.query.origin ?? ""),
        String(req.query.destination ?? ""),
        originCoordinates,
      ),
    );
  } catch (error) {
    next(error);
  }
});

export default router;
