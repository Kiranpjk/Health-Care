import express from "express";
import {
  addPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateId, validatePatient } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", validatePatient(), addPatient);
router.get("/", getPatients);
router.get("/:id", validateId(), getPatient);
router.put("/:id", validateId(), validatePatient(true), updatePatient);
router.delete("/:id", validateId(), deletePatient);

export default router;
