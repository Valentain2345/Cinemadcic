// consumer.js
import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/moviesdb';
const QUEUE_NAME = process.env.QUEUE_NAME || 'calificaciones_queue';

let channel = null;
let db = null;                 // <-- will hold the connected DB
let dbReady = false;

const client = new MongoClient(MONGODB_URI);

// ---------------------------------------------------------------------
// 1. Connect to MongoDB (single connection)
// ---------------------------------------------------------------------
async function connectDB() {
  try {
    await client.connect();
    db = client.db();                     // <-- default DB from URI
    console.log('[Consumer] MongoDB connected (MongoClient)');

    // optional: create indexes once
    await db.collection('movies').createIndex({ 'imdb.id': 1 });
    await db.collection('ratings').createIndex({ movieId: 1 });

    dbReady = true;
  } catch (err) {
    console.error('[Consumer] MongoDB error:', err.message);
    setTimeout(connectDB, 5000);
  }
}

// ---------------------------------------------------------------------
// 2. Connect to RabbitMQ – only after DB is ready
// ---------------------------------------------------------------------
async function connectRabbitMQ() {
  if (!dbReady) {
    console.log('[Consumer] Waiting for DB before starting RabbitMQ...');
    setTimeout(connectRabbitMQ, 1000);
    return;
  }

  try {
    console.log('[Consumer] Connecting to RabbitMQ...');
    const conn = await amqp.connect(RABBITMQ_URL);
    channel = await conn.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[Consumer] Listening on "${QUEUE_NAME}"`);

    channel.consume(
  QUEUE_NAME,
  async (msg) => {
    if (!msg) return;

    let data;
    try {
      data = JSON.parse(msg.content.toString());
    } catch (e) {
      console.warn('[Consumer] Invalid JSON – discarding');
      channel.ack(msg);
      return;
    }

    // --------------------------------------------------------------
    // 1. Extract fields (movieName & year are now optional)
    // --------------------------------------------------------------
    const {
      userId,
      movieId,
      movieName,   // ← may be undefined
      year,        // ← may be undefined
      rating,
      comment,
      timestamp,
    } = data;

    if (!userId || !movieId || rating == null) {
      console.warn('[Consumer] Missing required fields', data);
      channel.ack(msg);
      return;
    }

    // --------------------------------------------------------------
    // 2. Try to find the movie
    // --------------------------------------------------------------
    let movieDoc = null;

    // ---- 2a. Primary: imdb.id (numeric) ----
    if (movieId) {
      movieDoc = await db
        .collection('movies')
        .findOne({ 'imdb.id': Number(movieId) });
    }

    // ---- 2b. Fallback: title + optional year (exact match) ----
    if (!movieDoc && movieName) {
      const titleQuery = { title: movieName.trim() };
      if (year) titleQuery.year = Number(year);   // year is a number in the DB

      movieDoc = await db
        .collection('movies')
        .findOne(titleQuery);

      if (movieDoc) {
        console.log('[Consumer] Movie found via title/year fallback', {
          imdbId: movieId,
          title: movieName,
          year,
          mongoId: movieDoc._id,
        });
      }
    }

    // ---- 2c. Last resort: fuzzy search (same logic you use in /search) ----
    if (!movieDoc && movieName) {
      const escaped = movieName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      movieDoc = await db
        .collection('movies')
        .findOne({
          $or: [
            { title: { $regex: escaped, $options: 'i' } },
            { genres: { $elemMatch: { $regex: escaped, $options: 'i' } } },
            { directors: { $elemMatch: { $regex: escaped, $options: 'i' } } },
          ],
        });

      if (movieDoc) {
        console.log('[Consumer] Movie found via fuzzy search', {
          imdbId: movieId,
          title: movieName,
          year,
          mongoId: movieDoc._id,
        });
      }
    }

    if (!movieDoc) {
      console.warn('[Consumer] Movie NOT FOUND', {
        imdbId: movieId,
        title: movieName,
        year,
      });
      channel.ack(msg);
      return;
    }

    // --------------------------------------------------------------
    // 3. Save the rating (movieId → MongoDB ObjectId)
    // --------------------------------------------------------------
    try {
      const insertResult = await db.collection('ratings').insertOne({
        movieId: movieDoc._id,               // ObjectId of the movie
        userId,
        rating,
        comment: comment || '',
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });

      console.log('[Consumer] Rating saved', {
        _id: insertResult.insertedId,
        imdbId: movieId,
        mongoMovieId: movieDoc._id,
        rating,
        userId,
      });

      channel.ack(msg);
    } catch (err) {
      console.error('[Consumer] Save error:', err);
      channel.nack(msg, false, false);
    }
  },
  { noAck: false }
);

    // ---- reconnection handling ----
    conn.on('close', () => {
      console.error('[Consumer] RabbitMQ closed – reconnecting...');
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });
    conn.on('error', () => {
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });
  } catch (err) {
    console.error('[Consumer] RabbitMQ error:', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

// ---------------------------------------------------------------------
// 3. REST endpoints (plain driver)
// ---------------------------------------------------------------------
app.get('/ratings', async (_req, res) => {
  try {
    const ratings = await db
      .collection('ratings')
      .aggregate([
        {
          $lookup: {
            from: 'movies',
            localField: 'movieId',
            foreignField: '_id',
            as: 'movie',
          },
        },
        { $unwind: '$movie' },
        {
          $project: {
            _id: 1,
            movieId: 1,
            userId: 1,
            rating: 1,
            comment: 1,
            timestamp: 1,
            'movie.title': 1,
            'movie.genres': 1,
            'movie.year': 1,
          },
        },
      ])
      .toArray();

    res.json({ count: ratings.length, ratings });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/movies-with-ratings', async (_req, res) => {
  try {
    const agg = await db
      .collection('ratings')
      .aggregate([
        {
          $group: {
            _id: '$movieId',
            averageRating: { $avg: '$rating' },
            ratingCount: { $sum: 1 },
            commentsCount: {
              $sum: { $cond: [{ $gt: [{ $strLenCP: '$comment' }, 0] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'movies',
            localField: '_id',
            foreignField: '_id',
            as: 'movie',
          },
        },
        { $unwind: '$movie' },
        {
          $project: {
            _id: 0,
            movieId: '$_id',
            title: '$movie.title',
            genres: '$movie.genres',
            year: '$movie.year',
            averageRating: { $round: ['$averageRating', 2] },
            ratingCount: 1,
            commentsCount: 1,
          },
        },
      ])
      .toArray();

    res.json(agg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    rabbitmq: channel ? 'connected' : 'disconnected',
    mongodb: dbReady ? 'connected' : 'disconnected',
  });
});

// ---------------------------------------------------------------------
// 4. Start everything
// ---------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[Consumer] HTTP server on :${PORT}`);
  connectDB();          // will set dbReady = true
  connectRabbitMQ();    // will wait for dbReady
});
