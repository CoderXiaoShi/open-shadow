const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  menu_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'permissions',
  indexes: [
    {
      unique: true,
      fields: ['role_id', 'menu_id']
    }
  ]
});

module.exports = Permission;