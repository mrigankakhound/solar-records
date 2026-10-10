const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminUsername || !adminPasswordHash) {
      console.error('Admin credentials not configured in environment variables.');
      return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    if (username !== adminUsername) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { username: adminUsername, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      admin: { username: adminUsername, role: 'admin' },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

const getMe = (req, res) => {
  res.json({
    success: true,
    admin: { username: req.admin.username, role: req.admin.role },
  });
};

const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports = { login, getMe, logout };
