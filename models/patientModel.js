import sql from "../config/db.js";

export const initPatientTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      age INT CHECK (age >= 0),
      gender VARCHAR(20) CHECK (gender IN ('male','female','other')),
      created_by INT REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
};

await initPatientTable();
