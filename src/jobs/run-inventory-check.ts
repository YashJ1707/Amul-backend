// src/jobs/run-inventory-check.ts

import { connectDB } from '../config/database';
import { fetchAndUpdateProducts } from '../services/productService';

/**
 * This script is designed to be executed by an external scheduler like Render Cron Jobs.
 * It performs the product update task once and then exits.
 */
const runTask = async (): Promise<void> => {
    console.log('⏰ Starting scheduled inventory check...');
    try {
      await connectDB();
    await fetchAndUpdateProducts();
    console.log('✅ Scheduled inventory check finished successfully.');
    process.exit(0); // Exit with success code
  } catch (error) {
    // console.error('❌ Scheduled inventory check failed:', error);
    process.exit(1); // Exit with error code
  }
};

// Immediately invoke the task
runTask();