import sql from "../config/db.js";
import { handleDbError } from "../utils/dbErrors.js";

// All mapping queries are scoped to patients created by the authenticated user.

export const assignDoctor = async (req, res) => {
  try {
    const { patient_id, doctor_id } = req.body;

    const patient = await sql`
      SELECT id FROM patients WHERE id = ${patient_id} AND created_by = ${req.user.id}
    `;
    if (!patient[0]) return res.status(404).json({ message: "Patient not found" });

    const result = await sql`
      INSERT INTO patient_doctor_mappings (patient_id, doctor_id)
      VALUES (${patient_id}, ${doctor_id})
      RETURNING *;
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    handleDbError(res, error, "Assign doctor");
  }
};

export const getMappings = async (req, res) => {
  try {
    const mappings = await sql`
      SELECT m.*
      FROM patient_doctor_mappings m
      JOIN patients p ON p.id = m.patient_id
      WHERE p.created_by = ${req.user.id}
      ORDER BY m.id
    `;
    res.json(mappings);
  } catch (error) {
    handleDbError(res, error, "Get mappings");
  }
};

export const getPatientDoctors = async (req, res) => {
  try {
    const doctors = await sql`
      SELECT d.*
      FROM doctors d
      JOIN patient_doctor_mappings m ON d.id = m.doctor_id
      JOIN patients p ON p.id = m.patient_id
      WHERE m.patient_id = ${req.params.patient_id} AND p.created_by = ${req.user.id}
      ORDER BY d.id
    `;
    res.json(doctors);
  } catch (error) {
    handleDbError(res, error, "Get patient doctors");
  }
};

export const removeMapping = async (req, res) => {
  try {
    const deleted = await sql`
      DELETE FROM patient_doctor_mappings m
      USING patients p
      WHERE m.id = ${req.params.id} AND p.id = m.patient_id AND p.created_by = ${req.user.id}
      RETURNING m.*;
    `;
    if (!deleted[0]) return res.status(404).json({ message: "Mapping not found" });
    res.json({ message: "Mapping removed successfully" });
  } catch (error) {
    handleDbError(res, error, "Remove mapping");
  }
};
