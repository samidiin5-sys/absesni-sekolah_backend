'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate(models) {
      // Class hasMany Student
      Class.hasMany(models.Student, {
        foreignKey: 'classId',
        as: 'students',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
      // Class hasMany Attendance
      Class.hasMany(models.Attendance, {
        foreignKey: 'classId',
        as: 'attendances',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
  }
  Class.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    major: {
      type: DataTypes.STRING,
      allowNull: false
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[10, 11, 12]]
      }
    },
    schoolYear: {
      type: DataTypes.STRING,
      allowNull: false
    },
    homeroomTeacher: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Class',
    tableName: 'classes',
    timestamps: true
  });
  return Class;
};
