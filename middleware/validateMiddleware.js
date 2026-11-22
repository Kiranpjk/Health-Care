import { body, param, validationResult } from "express-validator";

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};

const GENDERS = ["male", "female", "other"];

export const validateRegister = [
  body("name").isString().trim().notEmpty(),
  body("email").isEmail(),
  body("password").isString().isLength({ min: 6 }),
  handleErrors,
];

export const validateLogin = [
  body("email").isEmail(),
  body("password").isString().notEmpty(),
  handleErrors,
];

export const validateId = (name = "id") => [param(name).isInt({ min: 1 }).toInt(), handleErrors];

export const validatePatient = (partial = false) => {
  const opt = (chain) => (partial ? chain.optional() : chain);
  return [
    opt(body("name").isString().trim().notEmpty()),
    body("age").optional({ values: "null" }).isInt({ min: 0 }).toInt(),
    body("gender").optional({ values: "null" }).isIn(GENDERS),
    handleErrors,
  ];
};

export const validateDoctor = (partial = false) => {
  const opt = (chain) => (partial ? chain.optional() : chain);
  return [
    opt(body("name").isString().trim().notEmpty()),
    opt(body("specialization").isString().trim().notEmpty()),
    handleErrors,
  ];
};

export const validateMapping = [
  body("patient_id").isInt({ min: 1 }).toInt(),
  body("doctor_id").isInt({ min: 1 }).toInt(),
  handleErrors,
];
