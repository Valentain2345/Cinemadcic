import { MongoClient } from "mongodb";

const targetDbName = "moviesdb";
const targetCollectionName = "movies";
const targetUri = process.env.MONGO_URI||"mongodb://localhost:27017/moviesdb"
const targetClient = new MongoClient(targetUri);
const connectDB = async () => {
  try {

    await targetClient.connect();
    console.log('[Movies] Connected to MongoDB');
  } catch (error) {
    console.error('[Movies] MongoDB connection error:', error.message);
    setTimeout(connectDB, 5000);
  }
};

export default connectDB;
