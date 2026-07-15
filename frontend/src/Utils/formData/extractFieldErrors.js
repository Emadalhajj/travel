export const extractFieldErrors = (error) => {
  const errors = {};
  
 // AppError with field property
  if (error?.field && error?.message) {
    errors[error.field] = error.message;
    return errors;
  }

  // mongoose validation
  if (error?.errors) {
    Object.keys(error.errors).forEach((field) => {
      errors[field] = error.errors[field]?.message;
    });

    return errors;
  }

  // joi validation
  if (Array.isArray(error?.details)) {
    error.details.forEach((item) => {
      const field = item.path?.join(".");
      errors[field] = item.message;
    });

    return errors;
  }

  return errors;
};