const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const seedDemoData = require('./config/seed');

dotenv.config();

const app = express();

// Connect SQLite
connectDB().then(() => {
  seedDemoData();
}).catch((err) => {
  console.error('Failed to initialize database', err);
});

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://library-9edms2k1c-deepak-kushwahas-projects.vercel.app"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Public Static Files (Covers ONLY - Ebooks and Audio are DRM Gated)
app.use('/uploads/covers', express.static(path.join(__dirname, 'uploads/covers')));

// API Routes
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running 🚀"
  });
});
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/stream', require('./routes/streamRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/wallet', require('./routes/walletRoutes'));
app.use('/api/download', require('./routes/downloadRoutes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'ReadPulse SQLite Platform',
    timestamp: new Date()
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
