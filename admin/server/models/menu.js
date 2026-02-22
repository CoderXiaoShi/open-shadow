const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Menu = sequelize.define('Menu', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  path: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  component: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  }
}, {
  tableName: 'menus'
});

Menu.associate = (models) => {
  Menu.hasMany(models.Permission, { foreignKey: 'menu_id', as: 'permissions' });
};

module.exports = Menu;