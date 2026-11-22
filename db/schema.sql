-- Database schema. Used by the app on startup (CREATE ... IF NOT EXISTS)
-- and by docker-compose as the Postgres init script.

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS patients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  age INT CHECK (age >= 0),
  gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
  created_by INT REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  specialization VARCHAR(150) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_doctor_mappings (
  id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (patient_id, doctor_id)
);
