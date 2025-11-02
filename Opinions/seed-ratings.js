// seed-ratings.js
import mongoose from 'mongoose';
import Movie from './Movie.js';
import Rating from './Rating.js';

// MongoDB connection
const MONGO_URI = 'mongodb://localhost:27017/moviesdb';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('[Seed] Conectado a MongoDB'))
.catch(err => console.error('[Seed] Error MongoDB:', err));

const sampleComments = [
  "¡Me encantó esta película!",
  "No está mal, pero esperaba más.",
  "Actuaciones increíbles y trama envolvente.",
  "Podría haber sido mejor.",
  "Una obra maestra del cine.",
  "Entretenida, pero predecible.",
  "Definitivamente la vería de nuevo."
];

function getRandomComment() {
  return sampleComments[Math.floor(Math.random() * sampleComments.length)];
}

async function seedRatings() {
  try {
    const movies = await Movie.find({}).limit(5); // solo 4-5 películas
    if (movies.length === 0) {
      console.log('[Seed] No hay películas en la DB. Primero inserta las películas.');
      process.exit(1);
    }

    const ratings = [];

    movies.forEach(movie => {
      const numberOfRatings = Math.floor(Math.random() * 3) + 2; // 2-4 ratings por película
      for (let i = 0; i < numberOfRatings; i++) {
        ratings.push({
          movieId: movie.id,
          userId: `user${Math.floor(Math.random() * 20) + 1}`,
          rating: Math.floor(Math.random() * 5) + 1,
          comment: getRandomComment(),
          timestamp: new Date()
        });
      }
    });

    await Rating.insertMany(ratings);
    console.log(`[Seed] Inseradas ${ratings.length} calificaciones`);
    process.exit(0);

  } catch (err) {
    console.error('[Seed] Error:', err);
    process.exit(1);
  }
}

seedRatings();
