const mongoose = require('mongoose');

const settledReferralSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  surname: {
    type: String,
    required: [true, 'Surname is required']
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required']
  },
  preferredContactTime: {
    type: String,
    default: ''
  },
  businessUnit: {
    type: String,
    enum: {
      values: ['Advocacy', 'Business Brokers', 'Global Properties'],
      message: 'Business Unit must be Advocacy, Business Brokers, or Global Properties'
    },
    required: [true, 'Business Unit is required']
  },
  commission: {
    type: Number,
    default: 0
  },
  assignedPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'partners'
  },
  date: {
    type: Date,
    default: Date.now
  },
  settledDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const SettledReferral = mongoose.model('settled_referrals', settledReferralSchema);
module.exports = SettledReferral; 