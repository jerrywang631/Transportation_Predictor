import cors from "cors";
import "dotenv/config";
import express from "express";

import weatherRouter from "./routes/weather";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/weather", weatherRouter);

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
