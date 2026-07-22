'use strict';

// FORCE BUNDLER TO INCLUDE MYSQL2
require('mysql2');

const Sequelize = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Explicitly require models for Vercel serverless compatibility
const User = require('./user')(sequelize, Sequelize.DataTypes);
const Class = require('./class')(sequelize, Sequelize.DataTypes);
const Student = require('./student')(sequelize, Sequelize.DataTypes);
const Subject = require('./subject')(sequelize, Sequelize.DataTypes);
const Attendance = require('./attendance')(sequelize, Sequelize.DataTypes);

db[User.name] = User;
db[Class.name] = Class;
db[Student.name] = Student;
db[Subject.name] = Subject;
db[Attendance.name] = Attendance;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
