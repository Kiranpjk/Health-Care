// Maps Postgres error codes to HTTP responses instead of returning 500 for client mistakes.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
export const handleDbError = (res, error, label) => {
  switch (error?.code) {
    case "23505": // unique_violation
      return res.status(409).json({ message: "Resource already exists" });
    case "23503": // foreign_key_violation
      return res.status(404).json({ message: "Referenced resource not found" });
    case "23502": // not_null_violation
    case "23514": // check_violation
    case "22P02": // invalid_text_representation (e.g. id = 'abc')
      return res.status(400).json({ message: "Invalid input" });
    default:
      console.error(`${label} error:`, error);
      return res.status(500).json({ message: "Server error" });
  }
};
