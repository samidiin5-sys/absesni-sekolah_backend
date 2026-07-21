const { response } = require('../helpers/response.formatter');

/**
 * Middleware to authorize specific roles
 * @param  {...string} allowedRoles Roles that are authorized to access the route
 */
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json(response(403, 'Forbidden: Role not specified'));
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json(response(403, 'Forbidden: Access denied'));
    }

    next();
  };
};

module.exports = allowRoles;
