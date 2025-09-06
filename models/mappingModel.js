import sql from "../config/db.js";

// Ensure patient_doctor_mappings table exists
export const initMappingTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS patient_doctor_mappings (
      id SERIAL PRIMARY KEY,
      patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(patient_id, doctor_id)
    )
  `;
};

await initMappingTable();
