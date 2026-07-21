const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Admin and Teacher can read or record attendance
router.get('/', allowRoles('admin', 'teacher'), attendanceController.getAllAttendances);
router.get('/:id', allowRoles('admin', 'teacher'), attendanceController.getAttendanceById);
router.post('/', allowRoles('admin', 'teacher'), attendanceController.createAttendance);

// Admin can modify/delete any; Teacher can only modify/delete their own (handled inside controller)
router.put('/:id', allowRoles('admin', 'teacher'), attendanceController.updateAttendance);
router.delete('/:id', allowRoles('admin', 'teacher'), attendanceController.deleteAttendance);

module.exports = router;
