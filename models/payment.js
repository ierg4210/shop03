"use strict";

module.exports = function(sequelize, DataTypes) {
  var Payment = sequelize.define("Payment", {
    userid: DataTypes.INTEGER,
    paymentid: DataTypes.STRING,
    state: DataTypes.STRING
  });
  return Payment;
};
