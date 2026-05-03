import { config } from 'dotenv';
config();

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs'
import morgan from 'morgan'

import authRoutes from './routes/auth.route.js';
import adminRoutes from './routes/admin.route.js';
import userRoutes from './routes/user.route.js';
import organizationRoutes from './routes/organization.route.js';
import incidentRoutes from './routes/incident.route.js';
import activityRoutes from './routes/activity.route.js';
import dmRoutes from './routes/dm.route.js';
import channelRoutes from './routes/channel.route.js';
import aiRoutes from './routes/ai.route.js';
import postmortemRoutes from './routes/postmortem.route.js';
import notificationRoutes from './routes/notification.route.js';
import statusPageRoutes from './routes/statusPage.route.js';
import errorHandler from './middlewares/errorHandler.middleware.js';

import { rateLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', express.static(uploadsDir));

app.use(morgan('dev'))

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(u => u.trim())
  : [
      "https://f1rr36mb-5173.inc1.devtunnels.ms",
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3002'
    ];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('InstaAlert API');
});

app.use(rateLimiter({ windowMs: 60000, max: 200 }));

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/user', userRoutes);
app.use('/organization', organizationRoutes);
app.use('/incidents', incidentRoutes);
app.use('/activities', activityRoutes);
app.use('/dm', dmRoutes);
app.use('/channels', channelRoutes);
app.use('/ai', aiRoutes);
app.use('/postmortems', postmortemRoutes);
app.use('/notifications', notificationRoutes);
app.use('/status-page', statusPageRoutes);

app.use(errorHandler);

export default app;
