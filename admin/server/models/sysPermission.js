const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  permission_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  permission_code: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1:菜单 2:按钮/接口'
  },
  path: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  component: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  sort: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'sys_permission',
  timestamps: false
});

module.exports = Permission;
