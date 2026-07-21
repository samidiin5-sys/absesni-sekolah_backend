const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Only admin allowed for all teacher CRUD operations
router.get('/', allowRoles('admin'), teacherController.getAllTeachers);
router.get('/:id', allowRoles('admin'), teacherController.getTeacherById);
router.post('/', allowRoles('admin'), teacherController.createTeacher);
router.put('/:id', allowRoles('admin'), teacherController.updateTeacher);
router.delete('/:id', allowRoles('admin'), teacherController.deleteTeacher);

module.exports = router;
