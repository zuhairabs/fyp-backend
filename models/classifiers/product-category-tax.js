const mongoose = require('mongoose');

const { Schema } = mongoose;

const categoryTax = new Schema({
  category: {type: String},
  sgst: {type: Number},
  cgst: {type: Number}
});

module.exports = mongoose.model('ProductCategoryTax', categoryTax, 'productcategorytax');