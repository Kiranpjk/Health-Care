import sql from "../config/db.js";

// Assign doctor to patient
export const assignDoctor = async (req, res) => {
  try {
    const { patient_id, doctor_id } = req.body;

    const result = await sql`
      INSERT INTO patient_doctor_mappings (patient_id, doctor_id)
      VALUES (${patient_id}, ${doctor_id})
      RETURNING *;
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("❌ Assign doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all mappings
export const getMappings = async (req, res) => {
  try {
    const mappings = await sql`
      SELECT * FROM patient_doctor_mappings
    `;
    res.json(mappings);
  } catch (error) {
    console.error("❌ Get mappings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all doctors for a patient
export const getPatientDoctors = async (req, res) => {
  try {
    const doctors = await sql`
      SELECT d.*
      FROM doctors d
      JOIN patient_doctor_mappings m ON d.id = m.doctor_id
      WHERE m.patient_id = ${req.params.patient_id}
    `;
    res.json(doctors);
  } catch (error) {
    console.error("❌ Get patient doctors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove a doctor from a patient
export const removeMapping = async (req, res) => {
  try {
    const deleted = await sql`
      DELETE FROM patient_doctor_mappings WHERE id = ${req.params.id} RETURNING *;
    `;
    if (!deleted[0]) return res.status(404).json({ message: "Mapping not found" });
    res.json({ message: "Mapping removed successfully" });
  } catch (error) {
    console.error("❌ Remove mapping error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
