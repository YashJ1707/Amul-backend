import cron from 'node-cron';
import { fetchAndUpdateProducts } from './productService';
import { Subscription } from '@/models/Subscription';

export const startCronJobs = (): void => {
  // Update products every 5 minutes for each unique substoreId
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🔄 Running scheduled product update for all substores...');
      const substoreIds = await Subscription.distinct('substoreId', { isActive: true, substoreId: { $ne: null } });
      for (const substoreId of substoreIds) {
        if (substoreId) {
          console.log(`⏰ Running product update for substore: ${substoreId}`);
          await fetchAndUpdateProducts(substoreId);
        }
      }
    } catch (error) {
      console.error('❌ Error running cron job for substores:', error);
    }
  });

  console.log('✅ Cron jobs started successfully');
};
