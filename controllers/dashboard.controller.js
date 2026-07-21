const { Student, Class, User, Attendance, Subject, sequelize } = require('../models');
const { response } = require('../helpers/response.formatter');
const { Op } = require('sequelize');

const getDashboardData = async (req, res) => {
  try {
    // 1. Get counts
    const totalStudents = await Student.count();
    const totalClasses = await Class.count();
    const totalTeachers = await User.count({ where: { role: 'teacher' } });

    // 2. Get today's attendance summary (present, permission, sick, absent)
    const todayStr = new Date().toISOString().split('T')[0];
    const present = await Attendance.count({ where: { attendanceDate: todayStr, status: 'present' } });
    const permission = await Attendance.count({ where: { attendanceDate: todayStr, status: 'permission' } });
    const sick = await Attendance.count({ where: { attendanceDate: todayStr, status: 'sick' } });
    const absent = await Attendance.count({ where: { attendanceDate: todayStr, status: 'absent' } });

    // 3. Get recent 10 attendances
    const recentAttendances = await Attendance.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'nis', 'fullName']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name']
        },
        {
          model: Subject,
          as: 'subject',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'name']
        }
      ]
    });

    // 4. Get weekly attendance summary grouped by date (last 7 days of attendance dates)
    const weeklyAttendance = await Attendance.findAll({
      attributes: [
        'attendanceDate',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal("SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END)"), 'presentCount'],
        [sequelize.literal("SUM(CASE WHEN status = 'permission' THEN 1 ELSE 0 END)"), 'permissionCount'],
        [sequelize.literal("SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END)"), 'sickCount'],
        [sequelize.literal("SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END)"), 'absentCount']
      ],
      where: {
        attendanceDate: {
          [Op.gte]: sequelize.literal('DATE_SUB(CURDATE(), INTERVAL 7 DAY)')
        }
      },
      group: ['attendanceDate'],
      order: [['attendanceDate', 'ASC']]
    });

    // Map weekly attendance query into numeric attributes for clean json response
    const formattedWeeklyAttendance = weeklyAttendance.map(item => {
      const json = item.toJSON();
      return {
        attendanceDate: json.attendanceDate,
        total: Number(json.total || 0),
        present: Number(json.presentCount || 0),
        permission: Number(json.permissionCount || 0),
        sick: Number(json.sickCount || 0),
        absent: Number(json.absentCount || 0)
      };
    });

    return res.status(200).json(response(200, 'Data dashboard berhasil diambil', {
      totalStudents,
      totalClasses,
      totalTeachers,
      todayAttendance: {
        present,
        permission,
        sick,
        absent
      },
      recentAttendances,
      weeklyAttendance: formattedWeeklyAttendance
    }));

  } catch (error) {
    console.error('Get Dashboard Data Error:', error);
    return res.status(500).json(response(500, 'Terjadi kesalahan pada server'));
  }
};

module.exports = {
  getDashboardData
};
