"use strict";

module.exports = function(sequelize, DataTypes){
  var User = sequelize.define("User", {
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    admin: DataTypes.STRING,
    resetpasswordtoken: DataTypes.STRING
  });
  return User;
};
