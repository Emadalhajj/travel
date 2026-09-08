class AppError extends Error {
  constructor(messageOrCode, statusCode = 400, field = null, params = {}) {
    super(messageOrCode);

    this.statusCode = statusCode;
    this.field = field;
    this.code = /^[A-Z][A-Z0-9_]+$/.test(messageOrCode)
      ? messageOrCode
      : null;
    this.params = params;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
