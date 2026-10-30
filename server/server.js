// Load settings from the .env file into process.env
require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');

// Open the database (creates data/classnest.db and the tables on first run)
require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Send files from the public/ folder (HTML, CSS, JS) to the browser as they are
app.use(express.static(path.join(__dirname, '..', 'public')));

// A tiny API route to check that the server is alive
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'ClassNest' });
});

// Start listening for requests
app.listen(PORT, () => {
  console.log(`ClassNest is running at http://localhost:${PORT}`);
});
