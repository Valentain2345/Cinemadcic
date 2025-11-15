// src/routes/movies.js
import express from 'express';
import MovieCollection from "./Movie.js";
const router = express.Router();

// GET /api/movies
router.get('/', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const movies = await MovieCollection
      .find({})
      .skip(offset)
      .limit(limit)
      .project({ _id: 0, __v: 0 })
      .toArray();

    res.json(movies);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Error al obtener películas' });
  }
});


// GET /api/movies/search?q=...
router.get('/search', async (req, res) => {
  let { q } = req.query;

  console.log('Raw q:', q);

  if (!q || typeof q !== 'string') {
    return res.status(38).json({ error: 'Falta parámetro q válido' });
  }

  q = q.trim();
  console.log('Trimmed q:', q);

  if (q.length === 0) {
    return res.status(400).json({ error: 'Parámetro q no puede estar vacío' });
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  console.log('Escaped q:', escaped);

  try {
    const movies = await MovieCollection
      .find({
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { genres: { $elemMatch: { $regex: escaped, $options: 'i' } } }, // ← FIXED!
          { directors: { $elemMatch: { $regex: escaped, $options: 'i' } } } // ← Also array!
        ]
      })
      .project({ _id: 0, __v: 0 })
      .limit(50)
      .toArray();

    console.log('Found movies:', movies.length);
    res.json(movies);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

export default router;
