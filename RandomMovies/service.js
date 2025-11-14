// random-movies-service/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// URL del microservicio Movies
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:3002';

// Cantidad total estimada de películas (debes ajustarlo si cambia)
const MOVIE_NUMBER = 21349;

app.use(cors());
app.use(express.json());

// Endpoint para obtener películas aleatorias
app.get('/random-movies', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;

    console.log(`[RandomMovies] Solicitando ${count} películas aleatorias...`);

    // Calculate random offset so the DB fetches a random slice
    const offset = Math.max(0, Math.floor(Math.random() * (MOVIE_NUMBER - count)));
    const limit = count * 2; // Fetch extra to improve randomness

    // Fetch using offset & limit
    const response = await axios.get(`${MOVIES_SERVICE_URL}/api/movies`, {
      params: { offset, limit }
    });

    const movies = response.data;

    // Pick random subset
    const randomMovies = pickRandomSubset(movies, count);

    console.log(`[RandomMovies] Devolviendo ${randomMovies.length} películas (offset=${offset}, limit=${limit})`);

    res.json(randomMovies);

  } catch (error) {
    console.error('[RandomMovies] Error:', error.message);
    res.status(500).json({
      error: 'Error al obtener películas aleatorias',
      details: error.message
    });
  }
});

// Select N random movies from a list
function pickRandomSubset(list, count) {
  if (list.length <= count) return list;

  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'random-movies' });
});

app.listen(PORT, () => {
  console.log(`[RandomMovies] Microservicio corriendo en puerto ${PORT}`);
  console.log(`[RandomMovies] Conectando con Movies service en: ${MOVIES_SERVICE_URL}`);
});
