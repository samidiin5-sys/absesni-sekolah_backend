const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');

// All routes here require authentication
router.use(authMiddleware);

router.get('/', allowRoles('admin', 'teacher'), classController.getAllClasses);
router.get('/:id', allowRoles('admin', 'teacher'), classController.getClassById);
router.post('/', allowRoles('admin'), classController.createClass);
router.put('/:id', allowRoles('admin'), classController.updateClass);
router.delete('/:id', allowRoles('admin'), classController.deleteClass);

module.exports = router;
