// api/index.ts
import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from '@/config/database';
import { startCronJobs } from '@/services/cronService';
import { fetchAndUpdateProducts } from '@/services/productService';
import productRoutes from '@/routes/productRoutes';
import subscriptionRoutes from '@/routes/subscriptionRoutes';
import healthRoutes from '@/routes/healthRoutes';
import testEmailRoutes from '@/routes/testEmailRoutes';
import telegramRoutes from '@/routes/telegramRoutes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api', testEmailRoutes);
app.use('/api/products', productRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/', healthRoutes);

app.get('/', (_req, res) => {
  res.send('Hello from Serverless Express!');
});

let isInitialized = false;

async function initializeApp() {
  if (!isInitialized) {
    await connectDB();
    await fetchAndUpdateProducts();
    startCronJobs();
    isInitialized = true;
  }
}

const handler = async (req: any, res: any) => {
  await initializeApp();
  const serverlessHandler = serverless(app);
  return serverlessHandler(req, res);
};

export default handler;
