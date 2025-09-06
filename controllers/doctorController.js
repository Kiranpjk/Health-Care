import sql from "../config/db.js";

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
    console.error("❌ Add doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await sql`SELECT * FROM doctors`;
    res.json(doctors);
  } catch (error) {
    console.error("❌ Get doctors error:", error);
    res.status(500).json({ message: "Server error" });
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
    console.error("❌ Get doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateDoctor = async (req, res) => {
  try {
    const { name, specialization } = req.body;

    const updated = await sql`
      UPDATE doctors
      SET name = ${name}, specialization = ${specialization}
      WHERE id = ${req.params.id}
      RETURNING *;
    `;

    if (!updated[0]) return res.status(404).json({ message: "Doctor not found" });
    res.json(updated[0]);
  } catch (error) {
    console.error("❌ Update doctor error:", error);
    res.status(500).json({ message: "Server error" });
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
    console.error("❌ Delete doctor error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
