// This utility function handles Mongoose validation errors and sends a structured response to the client.
export const handleMongooseValidation = (error, res) => {
  if (error.name !== "ValidationError") return false;

  const errors = Object.keys(error.errors).reduce((acc, key) => {
    acc[key] = error.errors[key].message;
    return acc;
  }, {});

  res.status(400).json({
    success: false,
    message: "Validation failed",
    errors,
  });

  return true;
};