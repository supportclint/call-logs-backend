const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Use the PORT from environment variables for Render, or default to 3001 for local dev
const PORT = process.env.PORT || 3001; 

// --- Critical CORS Configuration ---
// This tells the server to accept requests from your live frontend.
const allowedOrigins = [
  'https://calls.interactivebusinesssystems.com.au',
  'http://localhost:5173' // for local development
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Database Connection ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's managed database
  }
});

// --- API Endpoints ---

// Test endpoint
app.get('/api', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    if (result.rows.length > 0) {
      // Omit password from the returned user object for security
      const { password: _, ...user } = result.rows[0];
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for admin)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, "companyName", "contactNumber", "createdAt" FROM users ORDER BY "createdAt" DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new user (for admin)
app.post('/api/users', async (req, res) => {
    const { name, email, password, role, companyName, contactNumber } = req.body;
    // Basic validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create a simple unique ID
    const newId = `user-${Date.now()}`;

    try {
        const result = await pool.query(
            'INSERT INTO users (id, name, email, password, role, "companyName", "contactNumber") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role, "companyName", "contactNumber", "createdAt"',
            [newId, name, email, password, role, companyName, contactNumber]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        // Handle unique constraint violation for email
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A user with this email already exists.' });
        }
        console.error('Add user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Update a user's profile
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    // Only allow specific fields to be updated
    const { name, companyName, contactNumber, accountSid, authToken } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, "companyName" = $2, "contactNumber" = $3, "accountSid" = $4, "authToken" = $5 WHERE id = $6 RETURNING *',
            [name, companyName, contactNumber, accountSid, authToken, id]
        );
        if (result.rows.length > 0) {
            const { password: _, ...user } = result.rows[0];
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Generic function to get data for a specific user
const createUserDataEndpoint = (dataType, tableName) => {
  app.get(`/api/users/:userId/${dataType}`, async (req, res) => {
    const { userId } = req.params;
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE "userId" = $1 ORDER BY date DESC`, [userId]);
      // Normalize column names to camelCase for consistency on the frontend
      const mappedRows = result.rows.map(row => ({
          ...row,
          from: row.from_number,
          to: row.to_number,
          callType: row.callType,
          callSid: row.callSid,
          userId: row.userId,
      }));
      res.json(mappedRows);
    } catch (err) {
      console.error(`Get ${dataType} error:`, err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

createUserDataEndpoint('call-logs', 'call_logs');
createUserDataEndpoint('error-logs', 'error_logs');
createUserDataEndpoint('message-logs', 'message_logs');
createUserDataEndpoint('call-recordings', 'call_recordings');


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
