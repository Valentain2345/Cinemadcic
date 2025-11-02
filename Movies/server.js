import express from 'express';
import cors from 'cors';
import connectDB from './db.js';
import movieRoutes from './movierouter.js';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use('/api/movies', movieRoutes);

app.get('/', (req, res) => {
  res.send('Movies Service Running');
});

app.listen(PORT, () => {
  console.log(`[Movies] Microservicio en puerto ${PORT}`);
  connectDB();
});
