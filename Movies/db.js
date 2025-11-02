import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI||"mongodb://localhost:27017/movies";

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('[Movies] Connected to MongoDB');
  } catch (error) {
    console.error('[Movies] MongoDB connection error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
