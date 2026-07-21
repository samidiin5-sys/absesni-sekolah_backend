const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', allowRoles('admin', 'teacher'), studentController.getAllStudents);
router.get('/:id', allowRoles('admin', 'teacher'), studentController.getStudentById);
router.post('/', allowRoles('admin'), studentController.createStudent);
router.put('/:id', allowRoles('admin'), studentController.updateStudent);
router.delete('/:id', allowRoles('admin'), studentController.deleteStudent);

module.exports = router;
