import express from "express";
import {
  addDoctor,
  getDoctors,
  getDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addDoctor);
router.get("/", protect, getDoctors);
router.get("/:id", protect, getDoctor);
router.put("/:id", protect, updateDoctor);
router.delete("/:id", protect, deleteDoctor);

export default router;
