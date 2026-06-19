import Database from "better-sqlite3";
import "dotenv/config";
import { createReadStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";

const gtfsDir = process.env.GTFS_DATA_DIR;
const dbPath = process.env.GTFS_DB_PATH ?? "./data/gtfs.sqlite";

if (!gtfsDir) {
  throw new Error("GTFS_DATA_DIR is not configured in .env");
}

if (!existsSync(gtfsDir)) {
  throw new Error(`GTFS_DATA_DIR does not exist: ${gtfsDir}`);
}

mkdirSync(path.dirname(dbPath), { recursive: true });

const parseCsvLine = (line: string) => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
};

const importCsv = async (
  db: Database.Database,
  filename: string,
  tableName: string,
  columns: string[],
) => {
  const filePath = path.join(gtfsDir, filename);

  if (!existsSync(filePath)) {
    throw new Error(`Missing GTFS file: ${filePath}`);
  }

  const placeholders = columns.map(() => "?").join(", ");
  const insert = db.prepare(
    `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
  );
  const insertMany = db.transaction((rows: string[][]) => {
    rows.forEach((row) => insert.run(row));
  });
  const stream = createReadStream(filePath, { encoding: "utf8" });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let headers: string[] | null = null;
  let rowCount = 0;
  let batch: string[][] = [];

  for await (const rawLine of reader) {
    const line = rawLine.replace(/^\uFEFF/, "");
    if (!line.trim()) continue;

    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    const row = columns.map((column) => values[headers!.indexOf(column)] ?? "");
    batch.push(row);
    rowCount += 1;

    if (batch.length >= 5000) {
      insertMany(batch);
      batch = [];
      if (rowCount % 100000 === 0) {
        console.log(`Imported ${rowCount.toLocaleString()} rows from ${filename}`);
      }
    }
  }

  if (batch.length > 0) {
    insertMany(batch);
  }

  console.log(`Imported ${rowCount.toLocaleString()} rows from ${filename}`);
};

const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");

db.exec(`
  DROP TABLE IF EXISTS stops;
  DROP TABLE IF EXISTS routes;
  DROP TABLE IF EXISTS trips;
  DROP TABLE IF EXISTS stop_times;
  DROP TABLE IF EXISTS stop_routes;

  CREATE TABLE stops (
    stop_id TEXT PRIMARY KEY,
    stop_name TEXT NOT NULL,
    stop_lat REAL NOT NULL,
    stop_lon REAL NOT NULL
  );

  CREATE TABLE routes (
    route_id TEXT PRIMARY KEY,
    route_short_name TEXT,
    route_long_name TEXT
  );

  CREATE TABLE trips (
    route_id TEXT NOT NULL,
    trip_id TEXT PRIMARY KEY,
    trip_headsign TEXT,
    direction_id TEXT
  );

  CREATE TABLE stop_times (
    trip_id TEXT NOT NULL,
    arrival_time TEXT,
    departure_time TEXT,
    stop_id TEXT NOT NULL,
    stop_sequence INTEGER
  );

  CREATE TABLE stop_routes (
    stop_id TEXT NOT NULL,
    route_name TEXT NOT NULL,
    headsign TEXT,
    service_period TEXT NOT NULL
  );
`);

await importCsv(db, "stops.txt", "stops", [
  "stop_id",
  "stop_name",
  "stop_lat",
  "stop_lon",
]);
await importCsv(db, "routes.txt", "routes", [
  "route_id",
  "route_short_name",
  "route_long_name",
]);
await importCsv(db, "trips.txt", "trips", [
  "route_id",
  "trip_id",
  "trip_headsign",
  "direction_id",
]);
await importCsv(db, "stop_times.txt", "stop_times", [
  "trip_id",
  "arrival_time",
  "departure_time",
  "stop_id",
  "stop_sequence",
]);

console.log("Creating indexes...");
db.exec(`
  CREATE INDEX idx_stops_name ON stops(stop_name);
  CREATE INDEX idx_stop_times_stop_id ON stop_times(stop_id);
  CREATE INDEX idx_stop_times_trip_id ON stop_times(trip_id);
  CREATE INDEX idx_stop_times_stop_departure ON stop_times(stop_id, departure_time);
  CREATE INDEX idx_trips_route_id ON trips(route_id);
`);

console.log("Building stop_routes lookup table...");
db.exec(`
  INSERT INTO stop_routes (stop_id, route_name, headsign, service_period)
  SELECT DISTINCT
    stop_times.stop_id,
    COALESCE(NULLIF(routes.route_short_name, ''), routes.route_id) AS route_name,
    trips.trip_headsign AS headsign,
    CASE
      WHEN CAST(routes.route_short_name AS INTEGER) BETWEEN 300 AND 399 THEN 'night'
      ELSE 'day'
    END AS service_period
  FROM stop_times
  JOIN trips ON trips.trip_id = stop_times.trip_id
  JOIN routes ON routes.route_id = trips.route_id
  WHERE route_name IS NOT NULL
    AND route_name != '';

  CREATE INDEX idx_stop_routes_stop_period ON stop_routes(stop_id, service_period);
  CREATE INDEX idx_stop_routes_route_period ON stop_routes(route_name, service_period);
`);

console.log("Removing stops without scheduled service...");
const deletedStops = db
  .prepare(`
    DELETE FROM stops
    WHERE NOT EXISTS (
      SELECT 1
      FROM stop_times
      WHERE stop_times.stop_id = stops.stop_id
    )
  `)
  .run();

console.log(`Removed ${deletedStops.changes.toLocaleString()} stops without service.`);

db.close();

console.log(`GTFS SQLite database ready: ${dbPath}`);
