'use strict';
module.exports = (sequelize, DataTypes) => {
  const Person = sequelize.define('Person', {
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    username: DataTypes.STRING,
    assets: DataTypes.NUMBER,
    person_detail: DataTypes.NUMBER
  }, {});
  Person.associate = function(models) {
    // associations can be defined here
  };
  return Person;
};