"use strict";

module.exports = function(sequelize, DataTypes) {
  var FBUser = sequelize.define("FBUser", {
    fbemail: DataTypes.STRING,
    fbtoken: DataTypes.STRING,
    fbid: DataTypes.STRING,
    fbname: DataTypes.STRING
  });
  return FBUser;
};
