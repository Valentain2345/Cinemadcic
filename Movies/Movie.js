import { MongoClient } from "mongodb";

const targetUri = process.env.MONGO_URI||"mongodb://localhost:27017/movies"
const targetClient = new MongoClient(targetUri);
const targetDbName = "movies";
const targetCollectionName = "movies";
const targetDb = targetClient.db(targetDbName);
const MovieCollection = targetDb.collection(targetCollectionName);

export default MovieCollection
