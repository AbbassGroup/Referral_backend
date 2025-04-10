// index.js (Backend)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcryptjs = require('bcryptjs');

// Import models
const Partner = require('./Partner');
const Referral = require('./Referral');
const SettledReferral = require('./SettledReferral');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://abbass.group',
    'https://portal-qz8y.onrender.com',
    'http://localhost:3001',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.options('*', cors());

// Add a catch-all route for debugging
app.all('*', (req, res, next) => {
  console.log(`DEBUG - ${req.method} ${req.url}`, {
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Add a root route handler
app.get('/', (req, res) => {
  res.json({ 
    message: 'Referral Backend API is running',
    status: 'ok',
    version: '1.0.0'
  });
});

// Add logging middleware at the top after CORS
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Add a direct login route
app.post('/login', async (req, res) => {
  console.log('Direct login route hit');
  // Forward to the /api/login route
  return app._router.handle(req, res, () => {
    req.url = '/api/login';
    app._router.handle(req, res);
  });
});

// Define your login logic as a separate function
const handleLogin = async (req, res) => {
  try {
    const { name, password } = req.body;
    console.log('Login attempt for:', name);

    // 1. Check Admin first (only one admin exists)
    const admin = await Admin.findOne({ 'name ': name });
    if (admin) {
      // Compare plaintext password (admin password stored as plaintext)
      if (admin.password === password) {
        return res.json({
          success: true,
          role: 'admin',
          token: 'dummy-admin-token',
          user: { name: admin['name '].trim() }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }

    // 2. Check Partner (password is hashed)
    const partner = await Partner.findOne({ username: name }).select('+password');
    if (!partner) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcryptjs.compare(password, partner.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    return res.json({
      success: true,
      role: 'partner',
      token: 'dummy-partner-token',
      user: {
        _id: partner._id,
        firstname: partner.firstname,
        lastname: partner.lastname,
        username: partner.username,
        email: partner.email,
        company: partner.company
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Replace your app.post('/login') with this:
app.post('/login', handleLogin);

// Keep your existing app.post('/api/login') as-is
app.post('/api/login', handleLogin);

// JWT Authentication Middleware for partner validation (dummy check)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  if (token === 'dummy-partner-token') {
    const partnerId = req.query.partnerId || req.body.assignedPartner;
    if (!partnerId) {
      return res.status(401).json({ message: 'Partner ID not found' });
    }

    // For partner-specific routes, verify the partner can only access their own data
    if (req.path.startsWith('/api/partner/')) {
      const requestedPartnerId = req.query.partnerId;
      if (requestedPartnerId !== partnerId) {
        return res.status(403).json({ message: 'Not authorized to access other partner data' });
      }
    }

    req.user = { _id: partnerId };
    next();
  } else if (token === 'dummy-admin-token') {
    // Admin token has full access
    next();
  } else {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// MongoDB connection
mongoose.connect('mongodb+srv://adminUser:WebDeveloper1!@referral-portal.6vanldd.mongodb.net/referral_portal', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB admin database'))
.catch((err) => console.error('MongoDB connection error:', err));

// Define Admin schema/model (in collection 'admin_details')
// Note: Field name includes a trailing space.
const adminSchema = new mongoose.Schema({
  'name ': { type: String, required: true },
  password: { type: String, required: true }
}, { collection: 'admin_details' });
const Admin = mongoose.model('admin_details', adminSchema);

// (Optional) Get Admin route for debugging
app.get('/api/getAdmin', async (req, res) => {
  try {
    const admins = await Admin.find({}, { 'name ': 1, _id: 0 });
    console.log('Found admins:', admins);
    const cleanedAdmins = admins.map(admin => ({ name: admin['name '].trim() }));
    res.json(cleanedAdmins);
  } catch (error) {
    console.error('Error getting admin:', error);
    res.status(500).json({ message: 'Error fetching admin data' });
  }
});

// Test endpoint for server connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Admin Dashboard Data Route
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    // Debug: Get all unique status values
    const distinctStatuses = await Referral.distinct('status');
    console.log('All distinct status values in database:', distinctStatuses);

    const totalPartners = await Partner.countDocuments();
    
    // Use regex for case-insensitive matching and trim whitespace
    const newReferrals = await Referral.countDocuments({ 
      status: { $regex: new RegExp('^New lead$', 'i') }
    });
    
    const contactedReferrals = await Referral.countDocuments({ 
      status: { $regex: new RegExp('^Client engaged$', 'i') }
    });
    
    const pendingReferrals = await Referral.countDocuments({ 
      status: { $regex: new RegExp('^Settled$', 'i') }
    });
    
    const convertedReferrals = await Referral.countDocuments({ 
      status: { $regex: new RegExp('^Revenue$', 'i') }
    });
    
    // Get recent referrals with status and populate partner data
    const recentReferrals = await Referral.find()
      .populate('assignedPartner', 'firstname lastname company')
      .sort({ date: -1 })
      .limit(6)
      .select('firstName surname status date assignedPartner');
    
    console.log('Dashboard data being sent:', {
      totalPartners,
      referralStats: {
        new: newReferrals,
        contacted: contactedReferrals,
        pending: pendingReferrals,
        converted: convertedReferrals
      },
      recentReferrals
    });

    res.json({
      success: true,
      totalPartners,
      referralStats: {
        new: newReferrals,
        contacted: contactedReferrals,
        pending: pendingReferrals,
        converted: convertedReferrals
      },
      recentReferrals
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data',
      error: error.message 
    });
  }
});

// Debug route for admin data
app.get('/api/debug', async (req, res) => {
  try {
    const admins = await Admin.find({});
    console.log('All admins:', admins);
    res.json({ admins });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Partner Routes
app.get('/api/partners', async (req, res) => {
  try {
    const partners = await Partner.find().sort({ firstname: 1 });
    res.json(partners);
  } catch (error) {
    console.error('Error fetching partners:', error);
    res.status(500).json({ message: 'Error fetching partners' });
  }
});
app.post('/api/partners', async (req, res) => {
  try {
    const partner = new Partner(req.body);
    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    console.error('Error adding partner:', error);
    res.status(500).json({ message: 'Error adding partner' });
  }
});
app.delete('/api/partners/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Partner.findByIdAndDelete(id);
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ message: 'Error deleting partner' });
  }
});

// Referral Routes
app.get('/api/referrals', async (req, res) => {
  try {
    console.log('Fetching referrals with populated partner data...');
    const referrals = await Referral.find()
      .populate({
        path: 'assignedPartner',
        select: 'firstname lastname company email'
      })
      .sort({ date: -1 });
    
    if (!referrals) {
      console.log('No referrals found');
      return res.json([]);
    }
    
    console.log(`Found ${referrals.length} referrals`);
    res.json(referrals);
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ 
      message: 'Error fetching referrals',
      error: error.message 
    });
  }
});

app.post('/api/referrals', authenticateToken, async (req, res) => {
  try {
    console.log('Referral POST body:', req.body);
    if (!req.body.assignedPartner) {
      return res.status(400).json({ message: 'assignedPartner is required' });
    }
    
    // Verify that the authenticated user matches the assignedPartner
    if (req.user._id !== req.body.assignedPartner) {
      return res.status(403).json({ message: 'Not authorized to create referrals for other partners' });
    }
    
    const partner = await Partner.findById(req.body.assignedPartner);
    if (!partner) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Log the data being used to create the referral
    const referralData = {
      ...req.body,
      status: 'New lead'.trim() // Ensure no whitespace
    };
    console.log('Creating referral with data:', referralData);
    
    const referral = new Referral(referralData);
    await referral.save();
    
    // Debug: Verify the saved status
    const savedReferral = await Referral.findById(referral._id);
    console.log('Saved referral status:', savedReferral.status);
    console.log('Status type:', typeof savedReferral.status);
    console.log('Status length:', savedReferral.status.length);
    
    // Populate the partner data before sending the response
    const populatedReferral = await Referral.findById(referral._id)
      .populate({
        path: 'assignedPartner',
        select: 'firstname lastname company email'
      });
    
    console.log('Successfully saved referral:', populatedReferral);
    res.status(201).json(populatedReferral);
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ message: error.message || 'Error creating referral' });
  }
});

app.patch('/api/referrals/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`Updating referral ${id} status to ${status}`);

    const updatedReferral = await Referral.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate({
      path: 'assignedPartner',
      select: 'firstname lastname company email'
    });

    if (!updatedReferral) {
      console.log(`Referral ${id} not found`);
      return res.status(404).json({ message: 'Referral not found' });
    }

    console.log('Updated referral:', updatedReferral);
    res.json(updatedReferral);
  } catch (error) {
    console.error('Error updating referral status:', error);
    res.status(500).json({ 
      message: 'Error updating referral status',
      error: error.message 
    });
  }
});

// New route: Get referrals for a specific partner (by partnerId query parameter)
app.get('/api/partner/referrals', authenticateToken, async (req, res) => {
  try {
    const partnerId = req.query.partnerId;
    console.log('Fetching referrals for partnerId:', partnerId);
    
    if (!partnerId) {
      return res.status(400).json({ 
        success: false,
        message: 'partnerId is required' 
      });
    }

    // Verify partner exists
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ 
        success: false,
        message: 'Partner not found' 
      });
    }

    const referrals = await Referral.find({ assignedPartner: partnerId })
      .populate({
        path: 'assignedPartner',
        select: 'firstname lastname company email'
      })
      .sort({ date: -1 });

    console.log(`Found ${referrals.length} referrals for partner ${partnerId}`);
    
    res.json({
      success: true,
      data: referrals
    });
  } catch (error) {
    console.error('Error fetching partner referrals:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching referrals',
      error: error.message 
    });
  }
});

// New Partner Validation Endpoint
app.get('/api/partner/validate', authenticateToken, async (req, res) => {
  try {
    const partnerId = req.query.partnerId;
    console.log('Validating partner session:', partnerId);

    if (!partnerId) {
      return res.status(400).json({ 
        success: false,
        message: 'Partner ID is required' 
      });
    }

    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ 
        success: false,
        message: 'Partner not found' 
      });
    }

    res.json({ 
      success: true,
      partnerId: partner._id,
      email: partner.email,
      name: partner.username
    });
  } catch (error) {
    console.error('Partner validation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error validating partner session',
      error: error.message 
    });
  }
});

// Add this route after the other referral routes
app.patch('/api/referrals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedReferral = await Referral.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate({
      path: 'assignedPartner',
      select: 'firstname lastname company email'
    });

    if (!updatedReferral) {
      return res.status(404).json({ message: 'Referral not found' });
    }

    res.json(updatedReferral);
  } catch (error) {
    console.error('Error updating referral:', error);
    res.status(500).json({ message: 'Error updating referral' });
  }
});

// Add this route after the other referral routes
app.post('/api/referrals/:id/settle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the referral to be settled
    const referral = await Referral.findById(id);
    
    if (!referral) {
      return res.status(404).json({ message: 'Referral not found' });
    }
    
    // Create a new settled referral
    const settledReferral = new SettledReferral({
      firstName: referral.firstName,
      surname: referral.surname,
      contactNumber: referral.contactNumber,
      email: referral.email,
      preferredContactTime: referral.preferredContactTime,
      businessUnit: referral.businessUnit,
      commission: referral.commission,
      assignedPartner: referral.assignedPartner,
      date: referral.date,
      settledDate: new Date()
    });
    
    // Save the settled referral
    await settledReferral.save();
    
    // Delete the original referral
    await Referral.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Referral settled successfully',
      settledReferral
    });
  } catch (error) {
    console.error('Error settling referral:', error);
    res.status(500).json({ message: 'Error settling referral' });
  }
});

// Add a route to get all settled referrals
app.get('/api/settled-referrals', async (req, res) => {
  try {
    const { partnerId } = req.query;
    
    // Build query based on whether partnerId is provided
    let query = {};
    
    if (partnerId) {
      // Convert partnerId to MongoDB ObjectId
      const mongoose = require('mongoose');
      query = { assignedPartner: new mongoose.Types.ObjectId(partnerId) };
    }
    
    const settledReferrals = await SettledReferral.find(query)
      .populate({
        path: 'assignedPartner',
        select: 'firstname lastname company email'
      })
      .sort({ settledDate: -1 });
    
    res.json(settledReferrals);
  } catch (error) {
    console.error('Error fetching settled referrals:', error);
    res.status(500).json({ message: 'Error fetching settled referrals' });
  }
});

// Add a route to delete a settled referral
app.delete('/api/settled-referrals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete the settled referral
    const deletedReferral = await SettledReferral.findByIdAndDelete(id);
    
    if (!deletedReferral) {
      return res.status(404).json({ message: 'Settled referral not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Settled referral deleted successfully',
      deletedReferral
    });
  } catch (error) {
    console.error('Error deleting settled referral:', error);
    res.status(500).json({ message: 'Error deleting settled referral' });
  }
});

// Add this at the end of your file, before app.listen
// app.use((req, res) => {
//   console.log(`Method Not Allowed: ${req.method} ${req.url}`);
//   res.status(405).json({
//     success: false,
//     message: `Method ${req.method} not allowed for ${req.url}`,
//     allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
//   });
// });

const PORT =  process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});