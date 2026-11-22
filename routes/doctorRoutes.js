import express from "express";
import {
  addDoctor,
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateDoctor, validateId } from "../middleware/validateMiddleware.js";

const router = express.Router();

router.use(protect);
router.post("/", validateDoctor(), addDoctor);
router.get("/", getDoctors);
router.get("/:id", validateId(), getDoctor);
router.put("/:id", validateId(), validateDoctor(true), updateDoctor);
router.delete("/:id", validateId(), deleteDoctor);

export default router;
