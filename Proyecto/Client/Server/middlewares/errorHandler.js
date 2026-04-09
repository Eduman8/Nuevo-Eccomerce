const errorHandler = (err, _req, res, next) => {
  if (!err || !err.__handled) {
    return next(err);
  }

  if (err.logError) {
    console.error(err.logError);
  }

  return res.status(err.status || 500).json(err.payload || { error: "Error interno" });
};

module.exports = errorHandler;
