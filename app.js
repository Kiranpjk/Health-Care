import express from "express";
import sql from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import mappingRoutes from "./routes/mappingRoutes.js";

const app = express();
app.use(express.json());

// Liveness + database readiness check (used by Docker healthcheck and CI smoke test).
app.get("/health", async (req, res) => {
  try {
    await sql`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/mappings", mappingRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Malformed JSON body" });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Server error" });
});

export default app;
