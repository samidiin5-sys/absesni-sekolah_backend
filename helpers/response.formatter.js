/**
 * Helper to format response consistently
 * @param {number} status HTTP Status code
 * @param {string} message Custom message
 * @param {any} data Response payload
 */
const response = (status, message, data = null) => {
  const result = {
    status,
    message
  };

  if (data !== null && data !== undefined) {
    result.data = data;
  }

  return result;
};

module.exports = {
  response
};
