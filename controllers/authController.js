import sql from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { handleDbError } from "../utils/dbErrors.js";

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // role is not taken from the request body: clients must not be able to pick their own role.
    await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
    `;

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    handleDbError(res, error, "Register");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await sql`
      SELECT * FROM users WHERE email = ${email}
    `;
    const user = users[0];

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    handleDbError(res, error, "Login");
  }
};
