import sql from "../config/db.js";
import { handleDbError } from "../utils/dbErrors.js";

export const addDoctor = async (req, res) => {
  try {
    const { name, specialization } = req.body;

    const result = await sql`
      INSERT INTO doctors (name, specialization)
      VALUES (${name}, ${specialization})
      RETURNING *;
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    handleDbError(res, error, "Add doctor");
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await sql`SELECT * FROM doctors ORDER BY id`;
    res.json(doctors);
  } catch (error) {
    handleDbError(res, error, "Get doctors");
  }
};

export const getDoctor = async (req, res) => {
  try {
    const doctor = await sql`
      SELECT * FROM doctors WHERE id = ${req.params.id}
    `;
    if (!doctor[0]) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor[0]);
  } catch (error) {
    handleDbError(res, error, "Get doctor");
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { name = null, specialization = null } = req.body;

    // COALESCE keeps the current value for fields that were not sent.
    const updated = await sql`
      UPDATE doctors
      SET name = COALESCE(${name}, name),
          specialization = COALESCE(${specialization}, specialization)
      WHERE id = ${req.params.id}
      RETURNING *;
    `;

    if (!updated[0]) return res.status(404).json({ message: "Doctor not found" });
    res.json(updated[0]);
  } catch (error) {
    handleDbError(res, error, "Update doctor");
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const deleted = await sql`
      DELETE FROM doctors WHERE id = ${req.params.id} RETURNING *;
    `;
    if (!deleted[0]) return res.status(404).json({ message: "Doctor not found" });
    res.json({ message: "Doctor deleted successfully" });
  } catch (error) {
    handleDbError(res, error, "Delete doctor");
  }
};
