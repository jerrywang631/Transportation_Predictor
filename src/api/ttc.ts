import { apiRequest } from "./request";

export interface StopResult {
  source: "mock" | "gtfs" | "ttc";
  id: string;
  name: string;
  routes: string;
  distance: string;
}

export interface DestinationResult {
  source: "mock" | "gtfs" | "ttc";
  id: string;
  name: string;
  address: string;
  distance: string;
}

export interface NearbyStop {
  source: "mock" | "gtfs" | "ttc";
  stopId: string;
  name: string;
  pos: [number, number];
}

export interface Prediction {
  source: "mock" | "gtfs" | "ttc";
  stopName: string;
  routeId: number;
  direction: string;
  etaMin: number;
  dirs: [string, string];
  routes: number[];
  offsets: {
    schedule: number;
    weather: number;
    traffic: number;
    accidents: number;
    construction: number;
    other: number;
  };
}

export interface BusReport {
  source: "mock" | "gtfs" | "ttc";
  stopName: string;
  routeId: number;
  etaMin: number;
  factors: {
    schedule: { value: number; description: string };
    weather: { value: number; description: string };
    traffic: { value: number; description: string };
    accidents: { value: number; description: string };
    construction: { value: number; description: string };
    other: { value: number; description: string };
  };
}

export interface NavigationRoute {
  source: "mock" | "gtfs" | "ttc";
  destName: string;
  destAddress: string;
  walkMin: number;
  walkMeters: number;
  busStop: string;
  routeLabel: string;
  etaMin: number;
  departureTime: string;
  arrivalTime: string;
  totalStops: number;
  alsoAt: string[];
}

export interface StopMeta {
  source: "mock" | "gtfs" | "ttc";
  id: string;
  name: string;
  routes: number[];
  dirs: [string, string];
}

export function getStopMeta(stopId: string): Promise<StopMeta> {
  return apiRequest<StopMeta>(`/api/ttc/stops/${encodeURIComponent(stopId)}`);
}

export function searchStops(query: string): Promise<StopResult[]> {
  return apiRequest<StopResult[]>("/api/ttc/stops/search", {
    params: { q: query },
  });
}

export function searchDestinations(
  query: string,
): Promise<DestinationResult[]> {
  return apiRequest<DestinationResult[]>("/api/ttc/destinations/search", {
    params: { q: query },
  });
}

export function getNearbyStops(
  lat: number,
  lng: number,
): Promise<NearbyStop[]> {
  return apiRequest<NearbyStop[]>("/api/ttc/stops/nearby", {
    params: { lat, lng },
  });
}

export function getPrediction(
  stopId: string,
  routeId: number,
  direction: string,
): Promise<Prediction> {
  return apiRequest<Prediction>("/api/ttc/prediction", {
    params: { stopId, routeId, direction },
  });
}

export function getBusReport(
  stopId: string,
  routeId: number,
  direction: string,
): Promise<BusReport> {
  return apiRequest<BusReport>("/api/ttc/bus-report", {
    params: { stopId, routeId, direction },
  });
}

export function getNavigationRoute(
  origin: string,
  destination: string,
): Promise<NavigationRoute> {
  return apiRequest<NavigationRoute>("/api/ttc/navigation", {
    params: { origin, destination },
  });
}
