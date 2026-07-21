'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Subject extends Model {
    static associate(models) {
      // Subject belongsTo User as teacher
      Subject.belongsTo(models.User, {
        foreignKey: 'teacherId',
        as: 'teacher',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      // Subject hasMany Attendance
      Subject.hasMany(models.Attendance, {
        foreignKey: 'subjectId',
        as: 'attendances',
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      });
    }
  }
  Subject.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    code: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Subject',
    tableName: 'subjects',
    timestamps: true
  });
  return Subject;
};
