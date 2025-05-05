// // Partner.js
// const mongoose = require('mongoose');
// const bcryptjs = require('bcryptjs');

// const partnerSchema = new mongoose.Schema({
//   firstname: {
//     type: String,
//     required: [true, 'First name is required'],
//     trim: true
//   },
//   lastname: {
//     type: String,
//     required: [true, 'Last name is required'],
//     trim: true
//   },
//   company: {
//     type: String,
//     required: [true, 'Company is required'],
//     trim: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: [true, 'Email already exists'],
//     trim: true,
//     lowercase: true
//   },
//   number: {
//     type: String,
//     required: [true, 'Phone number is required'],
//     trim: true
//   },
//   name: {
//     type: String,
//     required: [true, 'Username is required'],
//     unique: [true, 'Username already exists'],
//     trim: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     select: false // Ensures password isn't returned in queries
//   }
// }, {
//   collection: 'partners',
//   timestamps: true
// });

// // Add index for unique fields
// partnerSchema.index({ email: 1 }, { unique: true });
// partnerSchema.index({ name: 1 }, { unique: true });

// partnerSchema.pre('save', async function(next) {
//   try {
//     if (this.isModified('password')) {
//       const salt = await bcryptjs.genSalt(10);
//       this.password = await bcryptjs.hash(this.password, salt);
//     }
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

// // Avoid duplicate model definition
// let Partner;
// try {
//   // Check if model is already defined
//   Partner = mongoose.model('partners');
// } catch (e) {
//   // Define model if not already defined
//   Partner = mongoose.model('partners', partnerSchema);
// }

// // const Partner = mongoose.model('partners', partnerSchema);
// module.exports = Partner;


// Partner.js
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

// Delete any existing model to prevent conflicts
try {
  delete mongoose.models.partners;
} catch (e) {
  // Ignore errors
}

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
  username: {  // Changed back from 'name' to 'username'
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