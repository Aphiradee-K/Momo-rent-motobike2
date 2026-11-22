// Express 4 does not forward rejected promises to the error handler.
// Wrap every async route handler with this.
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
