import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fakeSql, pgError, tokenFor } from "./helpers.js";
import app from "../app.js";

const auth = tokenFor(7);

beforeEach(() => fakeSql.reset());

describe("health", () => {
  test("GET /health returns ok when the DB answers", async () => {
    fakeSql.respond([{ "?column?": 1 }]);
    const res = await request(app).get("/health");
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: "ok", db: "up" });
  });

  test("GET /health returns 503 when the DB is down", async () => {
    fakeSql.respond(new Error("ECONNREFUSED"));
    const res = await request(app).get("/health");
    assert.equal(res.status, 503);
    assert.equal(res.body.db, "down");
  });

  test("unknown route returns JSON 404", async () => {
    const res = await request(app).get("/nope");
    assert.equal(res.status, 404);
    assert.equal(res.body.message, "Not found");
  });

  test("malformed JSON returns 400, not an HTML error page", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad json");
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Malformed JSON body");
  });
});

describe("auth", () => {
  test("register validates input", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "not-an-email" });
    assert.equal(res.status, 400);
    assert.ok(Array.isArray(res.body.errors));
    assert.equal(fakeSql.calls.length, 0);
  });

  test("register creates a user with a hashed password and ignores client role", async () => {
    fakeSql.respond([], []);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "secret123", role: "admin" });
    assert.equal(res.status, 201);
    const insert = fakeSql.calls[1];
    assert.match(insert.text, /INSERT INTO users \(name, email, password\)/);
    assert.equal(insert.values.length, 3);
    assert.notEqual(insert.values[2], "secret123");
    assert.ok(await bcrypt.compare("secret123", insert.values[2]));
  });

  test("register rejects duplicate email", async () => {
    fakeSql.respond([{ id: 1 }]);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Alice", email: "alice@example.com", password: "secret123" });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "User already exists");
  });

  test("login returns a JWT for valid credentials", async () => {
    const password = await bcrypt.hash("secret123", 4);
    fakeSql.respond([{ id: 3, role: "user", password }]);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "alice@example.com", password: "secret123" });
    assert.equal(res.status, 200);
    const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(payload.id, 3);
  });

  test("login rejects wrong password and unknown user", async () => {
    const password = await bcrypt.hash("secret123", 4);
    fakeSql.respond([{ id: 3, role: "user", password }], []);
    const wrong = await request(app).post("/api/auth/login").send({ email: "a@b.de", password: "nope" });
    const unknown = await request(app).post("/api/auth/login").send({ email: "x@b.de", password: "nope" });
    assert.equal(wrong.status, 400);
    assert.equal(unknown.status, 400);
  });

  test("login without password is a 400, not a 500", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "a@b.de" });
    assert.equal(res.status, 400);
  });
});

describe("auth middleware", () => {
  for (const path of ["/api/patients", "/api/doctors", "/api/mappings"]) {
    test(`${path} requires a token`, async () => {
      const res = await request(app).get(path);
      assert.equal(res.status, 401);
    });
  }

  test("rejects an invalid token", async () => {
    const res = await request(app).get("/api/doctors").set("Authorization", "Bearer garbage");
    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Invalid token");
  });
});

describe("patients", () => {
  test("create stores the patient for the current user", async () => {
    fakeSql.respond([{ id: 1, name: "John", age: 42, gender: "male", created_by: 7 }]);
    const res = await request(app)
      .post("/api/patients")
      .set("Authorization", auth)
      .send({ name: "John", age: 42, gender: "male" });
    assert.equal(res.status, 201);
    assert.deepEqual(fakeSql.calls[0].values, ["John", 42, "male", 7]);
  });

  test("create validates age and gender", async () => {
    const res = await request(app)
      .post("/api/patients")
      .set("Authorization", auth)
      .send({ name: "John", age: -1, gender: "robot" });
    assert.equal(res.status, 400);
    assert.equal(fakeSql.calls.length, 0);
  });

  test("list is scoped to the current user", async () => {
    fakeSql.respond([{ id: 1 }]);
    const res = await request(app).get("/api/patients").set("Authorization", auth);
    assert.equal(res.status, 200);
    assert.match(fakeSql.calls[0].text, /created_by = \?/);
    assert.deepEqual(fakeSql.calls[0].values, [7]);
  });

  test("get returns 404 for a patient owned by someone else", async () => {
    fakeSql.respond([]);
    const res = await request(app).get("/api/patients/5").set("Authorization", auth);
    assert.equal(res.status, 404);
    assert.deepEqual(fakeSql.calls[0].values, [5, 7]);
  });

  test("non-numeric id is a 400, not a 500", async () => {
    const res = await request(app).get("/api/patients/abc").set("Authorization", auth);
    assert.equal(res.status, 400);
    assert.equal(fakeSql.calls.length, 0);
  });

  test("partial update keeps fields that were not sent", async () => {
    fakeSql.respond([{ id: 5, name: "John", age: 43, gender: "male" }]);
    const res = await request(app).put("/api/patients/5").set("Authorization", auth).send({ age: 43 });
    assert.equal(res.status, 200);
    assert.match(fakeSql.calls[0].text, /COALESCE/);
    assert.deepEqual(fakeSql.calls[0].values, [null, 43, null, 5, 7]);
  });

  test("delete returns 404 when nothing was deleted", async () => {
    fakeSql.respond([]);
    const res = await request(app).delete("/api/patients/5").set("Authorization", auth);
    assert.equal(res.status, 404);
  });
});

describe("doctors", () => {
  test("create requires name and specialization", async () => {
    const res = await request(app).post("/api/doctors").set("Authorization", auth).send({ name: "Dr X" });
    assert.equal(res.status, 400);
  });

  test("create, list, get, delete", async () => {
    const doc = { id: 1, name: "Dr X", specialization: "Cardiology" };
    fakeSql.respond([doc], [doc], [doc], [doc]);
    const created = await request(app)
      .post("/api/doctors")
      .set("Authorization", auth)
      .send({ name: "Dr X", specialization: "Cardiology" });
    assert.equal(created.status, 201);
    assert.deepEqual(created.body, doc);
    assert.deepEqual((await request(app).get("/api/doctors").set("Authorization", auth)).body, [doc]);
    assert.deepEqual((await request(app).get("/api/doctors/1").set("Authorization", auth)).body, doc);
    assert.equal((await request(app).delete("/api/doctors/1").set("Authorization", auth)).status, 200);
  });

  test("get returns 404 for a missing doctor", async () => {
    fakeSql.respond([]);
    const res = await request(app).get("/api/doctors/99").set("Authorization", auth);
    assert.equal(res.status, 404);
  });

  test("unexpected DB errors return 500 without leaking details", async () => {
    fakeSql.respond(new Error("boom"));
    const res = await request(app).get("/api/doctors").set("Authorization", auth);
    assert.equal(res.status, 500);
    assert.deepEqual(res.body, { message: "Server error" });
  });
});

describe("mappings", () => {
  test("cannot assign a doctor to another user's patient", async () => {
    fakeSql.respond([]); // ownership lookup finds nothing
    const res = await request(app)
      .post("/api/mappings")
      .set("Authorization", auth)
      .send({ patient_id: 1, doctor_id: 2 });
    assert.equal(res.status, 404);
    assert.equal(fakeSql.calls.length, 1);
    assert.deepEqual(fakeSql.calls[0].values, [1, 7]);
  });

  test("assigns a doctor to own patient", async () => {
    fakeSql.respond([{ id: 1 }], [{ id: 10, patient_id: 1, doctor_id: 2 }]);
    const res = await request(app)
      .post("/api/mappings")
      .set("Authorization", auth)
      .send({ patient_id: 1, doctor_id: 2 });
    assert.equal(res.status, 201);
    assert.equal(res.body.id, 10);
  });

  test("duplicate mapping returns 409", async () => {
    fakeSql.respond([{ id: 1 }], pgError("23505"));
    const res = await request(app)
      .post("/api/mappings")
      .set("Authorization", auth)
      .send({ patient_id: 1, doctor_id: 2 });
    assert.equal(res.status, 409);
  });

  test("unknown doctor returns 404", async () => {
    fakeSql.respond([{ id: 1 }], pgError("23503"));
    const res = await request(app)
      .post("/api/mappings")
      .set("Authorization", auth)
      .send({ patient_id: 1, doctor_id: 999 });
    assert.equal(res.status, 404);
  });

  test("list and per-patient lookups are scoped to the current user", async () => {
    fakeSql.respond([], []);
    await request(app).get("/api/mappings").set("Authorization", auth);
    await request(app).get("/api/mappings/3").set("Authorization", auth);
    assert.deepEqual(fakeSql.calls[0].values, [7]);
    assert.deepEqual(fakeSql.calls[1].values, [3, 7]);
  });

  test("remove is scoped to the current user", async () => {
    fakeSql.respond([]);
    const res = await request(app).delete("/api/mappings/10").set("Authorization", auth);
    assert.equal(res.status, 404);
    assert.match(fakeSql.calls[0].text, /created_by = \?/);
  });
});
