const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection using Render's environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

// API Endpoints

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get all users (for Admin)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY "createdAt" DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Update a user
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, companyName, contactNumber } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = $1, "companyName" = $2, "contactNumber" = $3 WHERE id = $4 RETURNING *',
      [name, companyName, contactNumber, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get call logs for a user
app.get('/api/users/:userId/call-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT sid as id, date, from_number as "from", to_number as "to", duration, status, cost, direction, "callType" FROM call_logs WHERE "userId" = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get error logs for a user
app.get('/api/users/:userId/error-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM error_logs WHERE "userId" = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get message logs for a user
app.get('/api/users/:userId/message-logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, date, from_number as "from", to_number as "to", body, status, direction FROM message_logs WHERE "userId" = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Get call recordings for a user
app.get('/api/users/:userId/call-recordings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM call_recordings WHERE "userId" = $1', [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
