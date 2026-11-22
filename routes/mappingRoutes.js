import express from "express";
import {
  assignDoctor,
  getMappings,
  getPatientDoctors,
  removeMapping,
} from "../controllers/mappingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateId, validateMapping } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", validateMapping, assignDoctor);
router.get("/", getMappings);
router.get("/:patient_id", validateId("patient_id"), getPatientDoctors);
router.delete("/:id", validateId(), removeMapping);

export default router;
