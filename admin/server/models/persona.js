'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Persona = sequelize.define('Persona', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  bio: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  speech_style: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  background: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  example_qa: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  system_prompt: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'persona',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Persona;
