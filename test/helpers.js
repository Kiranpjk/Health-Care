import jwt from "jsonwebtoken";
import { setSql } from "../config/db.js";

process.env.JWT_SECRET = "test-secret";

// Minimal stand-in for the `postgres` tagged-template client.
// Each query shifts the next queued response; a queued Error is thrown instead.
export const createFakeSql = () => {
  const calls = [];
  const queue = [];
  const fake = (strings, ...values) => {
    calls.push({ text: strings.join("?").replace(/\s+/g, " ").trim(), values });
    const next = queue.length ? queue.shift() : [];
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next);
  };
  fake.calls = calls;
  fake.respond = (...responses) => queue.push(...responses);
  fake.reset = () => {
    calls.length = 0;
    queue.length = 0;
  };
  return fake;
};

export const fakeSql = createFakeSql();
setSql(fakeSql);

export const pgError = (code) => Object.assign(new Error(`pg error ${code}`), { code });

export const tokenFor = (id = 1, role = "user") =>
  `Bearer ${jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1h" })}`;
