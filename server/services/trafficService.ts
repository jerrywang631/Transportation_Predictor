export type TrafficEventType = "traffic" | "accident" | "construction";

export interface TrafficEvent {
  id: string;
  type: TrafficEventType;
  title: string;
  description: string;
  lat?: number;
  lng?: number;
  delayMin: number;
  source: "mock";
}

export interface TrafficImpact {
  source: "mock";
  trafficDelayMin: number;
  accidentDelayMin: number;
  constructionDelayMin: number;
  events: TrafficEvent[];
}

const getRouteNumber = (routeId: unknown) => {
  const parsed = Number(routeId);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function getTrafficImpact(
  lat: number,
  lng: number,
  routeId: unknown,
): TrafficImpact {
  const routeNumber = getRouteNumber(routeId);
  const downtownRoute = routeNumber >= 500 && routeNumber < 600;
  const busySurfaceRoute = routeNumber === 501 || routeNumber === 506 || routeNumber === 511;

  const trafficDelayMin = busySurfaceRoute ? 2 : downtownRoute ? 1 : 0;
  const accidentDelayMin = routeNumber === 501 ? 1 : 0;
  const constructionDelayMin = routeNumber === 506 ? 1 : 0;
  const events: TrafficEvent[] = [];

  if (trafficDelayMin > 0) {
    events.push({
      id: `mock-traffic-${routeNumber}`,
      type: "traffic",
      title: "Moderate downtown traffic",
      description: `Route ${routeNumber} is using a surface corridor where congestion may slow service.`,
      lat,
      lng,
      delayMin: trafficDelayMin,
      source: "mock",
    });
  }

  if (accidentDelayMin > 0) {
    events.push({
      id: `mock-accident-${routeNumber}`,
      type: "accident",
      title: "Minor incident near route corridor",
      description: `A mock incident is being used to test accident delay reporting for route ${routeNumber}.`,
      lat,
      lng,
      delayMin: accidentDelayMin,
      source: "mock",
    });
  }

  if (constructionDelayMin > 0) {
    events.push({
      id: `mock-construction-${routeNumber}`,
      type: "construction",
      title: "Construction activity near stop",
      description: `A mock construction event is being used to test construction delay reporting for route ${routeNumber}.`,
      lat,
      lng,
      delayMin: constructionDelayMin,
      source: "mock",
    });
  }

  return {
    source: "mock",
    trafficDelayMin,
    accidentDelayMin,
    constructionDelayMin,
    events,
  };
}
