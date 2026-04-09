const createHttpError = ({ status = 500, payload, logError = null }) => {
  const error = new Error("HTTP_ERROR");
  error.__handled = true;
  error.status = status;
  error.payload = payload;
  error.logError = logError;
  return error;
};

module.exports = {
  createHttpError,
};
