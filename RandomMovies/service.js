// random-movies-service/server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// URL del microservicio Movies
const MOVIES_SERVICE_URL = process.env.MOVIES_SERVICE_URL || 'http://localhost:3002';

app.use(cors());
app.use(express.json());

// Endpoint para obtener películas aleatorias
app.get('/random-movies', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 5;

    console.log(`[RandomMovies] Solicitando ${count} películas aleatorias...`);

    // Obtener todas las películas del microservicio Movies
    const response = await axios.get(`${MOVIES_SERVICE_URL}/api/movies`);
    const allMovies = response.data;

    // Seleccionar películas al azar
    const randomMovies = getRandomMovies(allMovies, count);

    console.log(`[RandomMovies] Devolviendo ${randomMovies.length} películas`);

    res.json(randomMovies);
  } catch (error) {
    console.error('[RandomMovies] Error:', error.message);
    res.status(500).json({
      error: 'Error al obtener películas aleatorias',
      details: error.message
    });
  }
});

// Función para seleccionar películas aleatorias
function getRandomMovies(movies, count) {
  const shuffled = [...movies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, movies.length));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'random-movies' });
});

app.listen(PORT, () => {
  console.log(`[RandomMovies] Microservicio corriendo en puerto ${PORT}`);
  console.log(`[RandomMovies] Conectando con Movies service en: ${MOVIES_SERVICE_URL}`);
});
