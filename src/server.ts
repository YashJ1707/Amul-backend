import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';
import testEmailRoutes from './routes/testEmailRoutes';
import { connectDB } from './config/database';
import healthRoutes from './routes/healthRoutes';
import productRoutes from './routes/productRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import telegramRoutes from './routes/telegramRoutes';
import { fetchAndUpdateProducts } from './services/productService';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/test-email', testEmailRoutes);
app.use('/api/products', productRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/health', healthRoutes);

app.get('/api', (_req, res) => {
  res.json({ 
    message: 'Hello from Serverless Express!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Global error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connection state management
let isConnected = false;

async function ensureConnection() {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  }
}

// Serverless handler
const handler = async (req: any, res: any) => {
  try {
    await ensureConnection();
    
    // Only fetch products on specific endpoint or schedule
    if (req.url?.includes('/api/products/refresh')) {
      await fetchAndUpdateProducts();
    }
    
    const serverlessHandler = serverless(app);
    return serverlessHandler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Server initialization failed' });
  }
};

export default handler;