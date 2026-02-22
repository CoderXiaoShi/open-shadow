const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'sys_user_role',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'role_id']
    }
  ]
});

module.exports = UserRole;
