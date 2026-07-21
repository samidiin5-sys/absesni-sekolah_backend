'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      // Student belongsTo Class
      Student.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      // Student hasMany Attendance
      Student.hasMany(models.Attendance, {
        foreignKey: 'studentId',
        as: 'attendances',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  Student.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    nis: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    timestamps: true
  });
  return Student;
};
