'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User hasMany Subject
      User.hasMany(models.Subject, {
        foreignKey: 'teacherId',
        as: 'subjects',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
      // User hasMany Attendance
      User.hasMany(models.Attendance, {
        foreignKey: 'teacherId',
        as: 'attendances',
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      });
    }
  }
  User.init({
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
    nip: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher'),
      allowNull: false,
      defaultValue: 'teacher'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true
  });
  return User;
};
