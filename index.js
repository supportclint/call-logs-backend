// Fix: Implemented a mock server to provide API data.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Mock Data
const users = [
  { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'admin', phone: '123-456-7890', address: '123 Admin St, City, Country' },
  { id: '2', name: 'Alice Johnson', email: 'alice@example.com', role: 'user', phone: '234-567-8901', address: '456 User Ave, City, Country' },
  { id: '3', name: 'Bob Smith', email: 'bob@example.com', role: 'user', phone: '345-678-9012', address: '789 Member Rd, City, Country' },
  { id: '4', name: 'Charlie Brown', email: 'charlie@example.com', role: 'user', phone: '456-789-0123', address: '101 Guest Ln, City, Country' },
];

const callLogs = {
  '2': Array.from({ length: 25 }, (_, i) => ({ id: `cl${i}`, userId: '2', date: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(), from: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`, to: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`, duration: Math.floor(Math.random() * 300), status: ['Completed', 'Busy', 'No-Answer', 'Failed'][i % 4], cost: Math.random() * 2 })),
  '3': Array.from({ length: 15 }, (_, i) => ({ id: `cl_bob_${i}`, userId: '3', date: new Date(Date.now() - i * 1000 * 60 * 60 * 12).toISOString(), from: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`, to: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`, duration: Math.floor(Math.random() * 500), status: ['Completed', 'No-Answer'][i % 2], cost: Math.random() * 3 })),
  '4': [],
};

const errorLogs = {
  '2': Array.from({ length: 5 }, (_, i) => ({ id: `el${i}`, userId: '2', date: new Date(Date.now() - i * 1000 * 60 * 60 * 48).toISOString(), code: `E${400 + i}`, message: `Error message number ${i}` })),
  '3': [],
  '4': [],
};

const messageLogs = {
  '2': Array.from({ length: 18 }, (_, i) => ({ id: `ml${i}`, userId: '2', date: new Date(Date.now() - i * 1000 * 60 * 30).toISOString(), direction: ['inbound', 'outbound'][i % 2], from: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`, to: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`, body: `This is a sample message ${i}.`, status: ['Sent', 'Delivered', 'Received', 'Failed'][i % 4] })),
  '3': [],
  '4': [],
};

const callRecordings = {
  '2': Array.from({ length: 8 }, (_, i) => ({ id: `cr${i}`, userId: '2', callSid: `CA${'x'.repeat(32).replace(/x/g, () => (Math.random()*16|0).toString(16))}`, date: new Date(Date.now() - i * 1000 * 60 * 60 * 72).toISOString(), duration: Math.floor(Math.random() * 120), url: '#' })),
  '3': [],
  '4': [],
};

// Routes

// Auth
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  // In a real app, you'd check the password hash
  if (user && password) { // Simple check for password existence
    res.json(user);
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Users
app.get('/api/users', (req, res) => {
  res.json(users);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const updatedUserData = req.body;
  const userIndex = users.findIndex(u => u.id === id);

  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updatedUserData };
    res.json(users[userIndex]);
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// Data fetching
app.get('/api/users/:userId/call-logs', (req, res) => {
  res.json(callLogs[req.params.userId] || []);
});
app.get('/api/users/:userId/error-logs', (req, res) => {
  res.json(errorLogs[req.params.userId] || []);
});
app.get('/api/users/:userId/message-logs', (req, res) => {
  res.json(messageLogs[req.params.userId] || []);
});
app.get('/api/users/:userId/call-recordings', (req, res) => {
  res.json(callRecordings[req.params.userId] || []);
});


app.listen(port, () => {
  console.log(`Mock API server listening at http://localhost:${port}`);
});
