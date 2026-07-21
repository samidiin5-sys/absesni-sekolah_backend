'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    static associate(models) {
      // Attendance belongsTo Student
      Attendance.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      // Attendance belongsTo Class
      Attendance.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      // Attendance belongsTo Subject
      Attendance.belongsTo(models.Subject, {
        foreignKey: 'subjectId',
        as: 'subject',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      // Attendance belongsTo User as teacher
      Attendance.belongsTo(models.User, {
        foreignKey: 'teacherId',
        as: 'teacher',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }
  Attendance.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    attendanceDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('present', 'permission', 'sick', 'absent'),
      allowNull: false
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Attendance',
    tableName: 'attendances',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['studentId', 'subjectId', 'attendanceDate'],
        name: 'unique_student_subject_date'
      }
    ]
  });
  return Attendance;
};
