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

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movie = await MovieCollection.findOne(
      { id: parseInt(req.params.id) },
      { projection: { _id: 0, __v: 0 } }
    );

    if (!movie) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener película' });
  }
});

// GET /api/movies/search?q=...
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;

  if (!q) {
    return res.status(400).json({ error: 'Falta parámetro q' });
  }

  try {
    const movies = await MovieCollection
      .find({
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { genre: { $regex: q, $options: 'i' } },
          { director: { $regex: q, $options: 'i' } }
        ]
      })
      .skip(offset)
      .limit(limit)
      .project({ _id: 0, __v: 0 })
      .toArray();

    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

export default router;
