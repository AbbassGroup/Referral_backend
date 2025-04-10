// Referral.js
const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
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
    default: ''  // Optional field
  },
  businessUnit: {
    type: String,
    enum: {
      values: ['Advocacy', 'Business Brokers', 'Global Properties'],
      message: 'Business Unit must be Advocacy, Business Brokers, or Global Properties'
    },
    required: [true, 'Business Unit is required']
  },
  status: {
    type: String,
    enum: {
      values: ['New lead', 'Client engaged', 'Settled', 'Revenue'],
      message: 'Status must be New lead, Client engaged, Settled, or Revenue'
    },
    default: 'New lead'
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
  }
}, {
  timestamps: true
});

const Referral = mongoose.model('referrals', referralSchema);
module.exports = Referral;