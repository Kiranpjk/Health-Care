import sql from "../config/db.js";

export const addPatient = async (req, res) => {
  try {
    const { name, age, gender } = req.body;

    const result = await sql`
      INSERT INTO patients (name, age, gender, created_by)
      VALUES (${name}, ${age}, ${gender}, ${req.user.id})
      RETURNING *;
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPatients = async (req, res) => {
  try {
    const patients = await sql`
      SELECT * FROM patients WHERE created_by = ${req.user.id}
    `;
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updatePatient = async (req, res) => {
  try {
    const { name, age, gender } = req.body;

    const updated = await sql`
      UPDATE patients
      SET name = ${name}, age = ${age}, gender = ${gender}
      WHERE id = ${req.params.id} AND created_by = ${req.user.id}
      RETURNING *;
    `;

    if (!updated[0]) return res.status(404).json({ message: "Patient not found" });
    res.json(updated[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
