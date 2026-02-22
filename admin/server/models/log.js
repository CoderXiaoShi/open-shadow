const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  result: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Log;