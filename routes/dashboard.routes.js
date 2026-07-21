const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Admin and Teacher can access dashboard
router.get('/', allowRoles('admin', 'teacher'), dashboardController.getDashboardData);

module.exports = router;
