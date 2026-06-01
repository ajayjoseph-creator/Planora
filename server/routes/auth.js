const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Otp = require('../models/Otp');
const User = require('../models/User');

// Helper to hash passwords using native crypto SHA-256
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Configure Nodemailer Transport from environment variables
const getTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return null;
};

// @desc    Verify Google login token
// @route   POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ message: 'Google Credential token is required' });
  }

  try {
    const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
    const response = await fetch(googleVerifyUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(400).json({ 
        message: 'Invalid Google credential token', 
        error: errorData.error_description 
      });
    }

    const payload = await response.json();
    const email = payload.email.toLowerCase();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        name: payload.name,
        email: email,
        avatar: payload.picture || '/avatar_woman_1.png'
      });
      await user.save();
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Authentication failed', error: err.message });
  }
});

// @desc    Register a new user (initiates email verification via OTP)
// @route   POST /api/auth/register-request
router.post('/register-request', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Account with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old OTP for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Save OTP to database
    const otpDoc = new Otp({
      email: normalizedEmail,
      otp,
    });
    await otpDoc.save();

    const transporter = getTransporter();
    
    if (transporter) {
      const mailOptions = {
        from: `"Planora Support" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Planora Email Verification Code',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb; font-weight: 800; margin: 0;">Planora</h2>
              <p style="color: #64748b; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1.5px;">Shape Your Life</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello ${name},</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Thank you for registering on **Planora**. Your verification code is:</p>
            <div style="background: #eff6ff; border-radius: 16px; padding: 15px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e40af;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This verification code is only valid for <strong>5 minutes</strong>. If you did not register on Planora, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0 15px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">&copy; 2026 Planora. All rights reserved.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'Verification OTP sent to your email', isMock: false });
    } else {
      console.log(`\n>>> [REGISTER] MOCK EMAIL OTP FOR: ${normalizedEmail} | OTP CODE: ${otp}\n`);
      return res.status(200).json({ 
        message: 'Verification OTP generated in Dev mode', 
        isMock: true, 
        mockOtp: otp 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to register. Server error', error: err.message });
  }
});

// @desc    Email/Password Sign-In
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials. User not found.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'This email is linked to Google Sign-In. Please log in with Google.' });
    }

    // Verify Password
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(400).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old OTP for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Save OTP to database
    const otpDoc = new Otp({
      email: normalizedEmail,
      otp,
    });
    await otpDoc.save();

    const transporter = getTransporter();
    
    if (transporter) {
      const mailOptions = {
        from: `"Planora Support" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Planora Login Verification Code',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb; font-weight: 800; margin: 0;">Planora</h2>
              <p style="color: #64748b; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1.5px;">Shape Your Life</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello ${user.name},</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your verification code for logging into **Planora** is:</p>
            <div style="background: #eff6ff; border-radius: 16px; padding: 15px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e40af;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This verification code is only valid for <strong>5 minutes</strong>. If you did not request this login code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0 15px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">&copy; 2026 Planora. All rights reserved.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'Verification OTP sent to your email', isMock: false });
    } else {
      console.log(`\n>>> [LOGIN] MOCK EMAIL OTP FOR: ${normalizedEmail} | OTP CODE: ${otp}\n`);
      return res.status(200).json({ 
        message: 'Verification OTP generated in Dev mode', 
        isMock: true, 
        mockOtp: otp 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Login failed. Server error', error: err.message });
  }
});

// @desc    Send OTP to existing user for password-less login
// @route   POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Only send OTP if user already exists
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'No account found with this email. Please Sign Up first.' });
    }

    await Otp.deleteMany({ email: normalizedEmail });
    const otpDoc = new Otp({ email: normalizedEmail, otp });
    await otpDoc.save();

    const transporter = getTransporter();
    
    if (transporter) {
      const mailOptions = {
        from: `"Planora Support" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Planora Login OTP Verification Code',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border-radius: 20px; border: 1px solid #e2e8f0; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #2563eb; font-weight: 800; margin: 0;">Planora</h2>
              <p style="color: #64748b; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 1.5px;">Shape Your Life</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Hello ${user.name},</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your one-time login verification code is:</p>
            <div style="background: #eff6ff; border-radius: 16px; padding: 15px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e40af;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This verification code is only valid for <strong>5 minutes</strong>. If you did not request this login code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0 15px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">&copy; 2026 Planora. All rights reserved.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return res.status(200).json({ message: 'OTP verification code sent to your email', isMock: false });
    } else {
      console.log(`\n>>> [LOGIN] MOCK EMAIL OTP FOR: ${normalizedEmail} | OTP CODE: ${otp}\n`);
      return res.status(200).json({ 
        message: 'OTP verification code generated in Dev mode', 
        isMock: true,
        mockOtp: otp 
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP verification code', error: err.message });
  }
});

// @desc    Verify OTP and finalize Registration/Login
// @route   POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp, name, password } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP code are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const otpDoc = await Otp.findOne({ email: normalizedEmail });

    if (!otpDoc) {
      return res.status(400).json({ message: 'Verification code has expired or is invalid' });
    }

    if (otpDoc.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP verification code' });
    }

    // OTP matches, delete it
    await Otp.deleteOne({ _id: otpDoc._id });

    // Find or create user
    let user = await User.findOne({ email: normalizedEmail });
    
    if (!user) {
      // Create user (typically during registration verification step)
      user = new User({
        name: name || 'Planora User',
        email: normalizedEmail,
        password: password ? hashPassword(password) : null,
        avatar: '/avatar_woman_1.png'
      });
      await user.save();
      console.log(`>>> Created new User via OTP: ${user.name} (${user.email})`);
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// @desc    Complete user profile (onboarding step for first-time users)
// @route   PUT /api/auth/complete-profile
router.put('/complete-profile', async (req, res) => {
  const { email, name, birthday } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name.trim();
    if (birthday) {
      user.birthday = birthday;
    }
    user.profileCompleted = true;
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
});

module.exports = router;
