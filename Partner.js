// Partner.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const partnerSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  number: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false // Ensures password isn't returned in queries
  }
}, {
  collection: 'partners'
});

partnerSchema.pre('save', async function(next) {
  try {
    if (this.isModified('password')) {
      const salt = await bcryptjs.genSalt(10);
      this.password = await bcryptjs.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Partner = mongoose.model('partners', partnerSchema);
module.exports = Partner;