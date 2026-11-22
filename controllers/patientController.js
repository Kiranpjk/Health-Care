import sql from "../config/db.js";
import { handleDbError } from "../utils/dbErrors.js";

export const addPatient = async (req, res) => {
  try {
    const { name, age = null, gender = null } = req.body;

    const result = await sql`
      INSERT INTO patients (name, age, gender, created_by)
      VALUES (${name}, ${age}, ${gender}, ${req.user.id})
      RETURNING *;
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    handleDbError(res, error, "Add patient");
  }
};

export const getPatients = async (req, res) => {
  try {
    const patients = await sql`
      SELECT * FROM patients WHERE created_by = ${req.user.id} ORDER BY id
    `;
    res.json(patients);
  } catch (error) {
    handleDbError(res, error, "Get patients");
  }
};

export const getPatient = async (req, res) => {
  try {
    const patient = await sql`
      SELECT * FROM patients WHERE id = ${req.params.id} AND created_by = ${req.user.id}
    `;
    if (!patient[0]) return res.status(404).json({ message: "Patient not found" });
    res.json(patient[0]);
  } catch (error) {
    handleDbError(res, error, "Get patient");
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { name = null, age = null, gender = null } = req.body;

    // COALESCE keeps the current value for fields that were not sent.
    const updated = await sql`
      UPDATE patients
      SET name = COALESCE(${name}, name),
          age = COALESCE(${age}, age),
          gender = COALESCE(${gender}, gender)
      WHERE id = ${req.params.id} AND created_by = ${req.user.id}
      RETURNING *;
    `;

    if (!updated[0]) return res.status(404).json({ message: "Patient not found" });
    res.json(updated[0]);
  } catch (error) {
    handleDbError(res, error, "Update patient");
  }
};

export const deletePatient = async (req, res) => {
  try {
    const deleted = await sql`
      DELETE FROM patients WHERE id = ${req.params.id} AND created_by = ${req.user.id} RETURNING *;
    `;
    if (!deleted[0]) return res.status(404).json({ message: "Patient not found" });
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    handleDbError(res, error, "Delete patient");
  }
};
