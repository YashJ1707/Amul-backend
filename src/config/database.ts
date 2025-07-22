import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = 'mongodb+srv://yjaybhaye1707:yash1234@cluster0.y155exh.mongodb.net/';
    
    await mongoose.connect(mongoURI, {
      dbName: 'amul-inventory'
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};