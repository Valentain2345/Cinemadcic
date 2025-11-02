import Movie from './Movie.js';
import Rating from './Rating.js';
import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import mongoose from 'mongoose';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3004;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/moviesdb';
const QUEUE_NAME = process.env.QUEUE_NAME || 'calificaciones_queue';

let channel = null;

// Connect to MongoDB
async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('[Consumer] Connected to MongoDB');
  } catch (err) {
    console.error('[Consumer] MongoDB connection error:', err.message);
    setTimeout(connectMongo, 5000);
  }
}

// Connect to RabbitMQ
async function connectRabbitMQ() {
  try {
    console.log('[Consumer] Connecting to RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[Consumer] Listening to queue "${QUEUE_NAME}"`);

    channel.consume(
      QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());

            // Find movie by movieId (assumes movieId is string representing ObjectId)
         const movie = await Movie.findOne({ id: parseInt(data.movieId) });

            if (!movie) {
              console.warn('[Consumer] Movie not found:', data.movieId);
              channel.ack(msg); // still ack to prevent retry loop
              return;
            }

            // Save rating
            const newRating = new Rating({
              movieId: movie._id,
              userId: data.userId,
              rating: data.rating,
              comment: data.comment || '',
              timestamp: data.timestamp || new Date()
            });
            await newRating.save();

            console.log('[Consumer] Rating saved:', newRating);
            channel.ack(msg);
          } catch (err) {
            console.error('[Consumer] Error processing message:', err);
            channel.nack(msg, false, false); // discard invalid messages
          }
        }
      },
      { noAck: false }
    );

    connection.on('close', () => {
      console.error('[Consumer] RabbitMQ connection closed. Reconnecting...');
      channel = null;
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('error', (err) => {
      console.error('[Consumer] RabbitMQ connection error:', err);
    });
  } catch (err) {
    console.error('[Consumer] Error connecting to RabbitMQ:', err.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}

// List all ratings
app.get('/ratings', async (req, res) => {
  try {
    const ratings = await Rating.find().populate('movieId', 'title genre releaseYear');
    res.json({ count: ratings.length, ratings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ratings', details: err.message });
  }
});

// List movies with average rating and number of ratings
app.get('/movies-with-ratings', async (req, res) => {
  try {
   const aggregation = await Rating.aggregate([
  {
    $group: {
      _id: '$movieId',                         // group by movie
      averageRating: { $avg: '$rating' },      // average rating
      ratingCount: { $sum: 1 },                // total reviews
      commentsCount: {                         // count reviews with comments
        $sum: {
          $cond: [{ $gt: [{ $strLenCP: '$comment' }, 0] }, 1, 0]
        }
      }
    }
  },
  {
    $lookup: {
      from: 'movies',
      localField: '_id',
      foreignField: '_id',
      as: 'movie'
    }
  },
  { $unwind: '$movie' },
  {
    $project: {
      movieId: '$_id',
      _id: 0,
      title: '$movie.title',
      genre: '$movie.genre',
      releaseYear: '$movie.releaseYear',
      averageRating: { $round: ['$averageRating', 2] },
      ratingCount: 1,
      commentsCount: 1
    }
  }
]);
    res.json(aggregation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movies with ratings', details: err.message });
  }
});

// Health check
app.get('/health', async (req, res) => {
  const mongoState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    service: 'rating-consumer',
    rabbitmq: channel ? 'connected' : 'disconnected',
    mongodb: mongoState
  });
});

// Start service
app.listen(PORT, () => {
  console.log(`[Consumer] Microservice running on port ${PORT}`);
  connectMongo();
  connectRabbitMQ();
});
