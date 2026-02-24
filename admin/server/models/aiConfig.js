'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AiConfig = sequelize.define('AiConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  provider: {
    type: DataTypes.STRING(50),
    defaultValue: 'openai'
  },
  api_key: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  base_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  model: {
    type: DataTypes.STRING(100),
    defaultValue: 'gpt-4o'
  },
  temperature: {
    type: DataTypes.FLOAT,
    defaultValue: 0.7
  },
  max_tokens: {
    type: DataTypes.INTEGER,
    defaultValue: 2000
  }
}, {
  tableName: 'ai_config',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AiConfig;
