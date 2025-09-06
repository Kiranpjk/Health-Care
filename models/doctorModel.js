import sql from "../config/db.js";

// Ensure doctors table exists
export const initDoctorTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      specialization VARCHAR(150) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

await initDoctorTable();
