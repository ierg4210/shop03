"use strict";

module.exports = function(sequelize, DataTypes) {
  var Product = sequelize.define("Product", {
    productName: DataTypes.STRING,
    productPrice: DataTypes.DECIMAL(6,2),
    productDesc: DataTypes.STRING,
    productImage: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        Product.belongsTo(models.Category);
      }
    }
  });
  return Product;
};
