// backend.js
const express = require('express');
const mysql = require('mysql2');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'notify',
});

const corsOptions = {
  origin: 'http://127.0.0.1:5500',  // Adjust this to match your frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Set up Socket.io with CORS
const io = new socketIO.Server(server, {
  cors: corsOptions,
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT
  )
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  }
});

app.post('/api/posts', express.json(), (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const insertQuery = 'INSERT INTO posts (title, content) VALUES (?, ?)';
  db.query(insertQuery, [title, content], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const insertedData = { id: result.insertId, title, content };

    io.emit('dataAdded', { table: 'xyz', data: insertedData });
    res.status(201).json(insertedData);

    console.log('Data added successfully:', insertedData);
  });
});

app.get('/api/posts', (req, res) => {
  const selectQuery = 'SELECT * FROM posts';
  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error retrieving data:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.json(results);
    console.log('Data retrieved successfully:', results);
  });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
