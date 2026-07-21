const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', allowRoles('admin', 'teacher'), subjectController.getAllSubjects);
router.get('/:id', allowRoles('admin', 'teacher'), subjectController.getSubjectById);
router.post('/', allowRoles('admin'), subjectController.createSubject);
router.put('/:id', allowRoles('admin'), subjectController.updateSubject);
router.delete('/:id', allowRoles('admin'), subjectController.deleteSubject);

module.exports = router;
