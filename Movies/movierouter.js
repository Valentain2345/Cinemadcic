// src/routes/movies.js
import express from 'express';
import Movie from './Movie.js';

const router = express.Router();

// GET /api/movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().select('-_id -__v');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener películas' });
  }
});

// GET /api/movies/:id
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOne({ id: parseInt(req.params.id) }).select('-_id -__v');
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener película' });
  }
});

// POST /api/movies
router.post('/', async (req, res) => {
  const { id, title, plot, year, genre, director } = req.body;
  if (!id || !title || !plot || !year || !genre) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  try {
    const exists = await Movie.findOne({ id });
    if (exists) return res.status(409).json({ error: 'ID ya existe' });

    const movie = new Movie({ id, title, plot, year, genre, director });
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Error creando película' });
  }
});

// PUT /api/movies/:id
router.put('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      req.body,
      { new: true, runValidators: true }
    ).select('-_id -__v');
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando' });
  }
});

// DELETE /api/movies/:id
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!movie) return res.status(404).json({ error: 'Película no encontrada' });
    res.json({ message: 'Eliminada', title: movie.title });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando' });
  }
});

// GET /api/movies/search?q=...
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Falta parámetro q' });

  try {
    const movies = await Movie.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { genre: { $regex: q, $options: 'i' } },
        { director: { $regex: q, $options: 'i' } }
      ]
    }).select('-_id -__v');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Error en búsqueda' });
  }
});

// Health check
router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', database: dbState });
});


export default router;
