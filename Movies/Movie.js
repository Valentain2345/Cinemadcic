import { MongoClient } from "mongodb";

const targetUri = process.env.MONGO_URI||"mongodb://localhost:27017/moviesdb"
const targetClient = new MongoClient(targetUri);
const targetDbName = "moviesdb";
const targetCollectionName = "movies";
const targetDb = targetClient.db(targetDbName);
const MovieCollection = targetDb.collection(targetCollectionName);

export default MovieCollection
