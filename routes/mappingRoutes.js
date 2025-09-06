import express from "express";
import {
  assignDoctor,
  getMappings,
  getPatientDoctors,
  removeMapping,
} from "../controllers/mappingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, assignDoctor);
router.get("/", protect, getMappings);
router.get("/:patient_id", protect, getPatientDoctors);
router.delete("/:id", protect, removeMapping);

export default router;
