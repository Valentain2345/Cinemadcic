// calificacion-service/server.js
const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');

const app = express();
const PORT = process.env.PORT || 3003;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE_NAME = 'calificaciones_queue';

let channel = null;

app.use(cors());
app.use(express.json());

// Conectar a RabbitMQ
async function connectRabbitMQ() {
  try {
    console.log('[Calificacion] Conectando a RabbitMQ...');
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log(`[Calificacion] Conectado a RabbitMQ. Cola: ${QUEUE_NAME}`);

    // Manejar reconexión si se pierde la conexión
    connection.on('close', () => {
      console.error('[Calificacion] Conexión a RabbitMQ cerrada. Reintentando...');
      setTimeout(connectRabbitMQ, 5000);
    });

    connection.on('error', (err) => {
      console.error('[Calificacion] Error de conexión RabbitMQ:', err);
    });
  } catch (error) {
    console.error('[Calificacion] Error conectando a RabbitMQ:', error.message);
    console.log('[Calificacion] Reintentando en 5 segundos...');
    setTimeout(connectRabbitMQ, 5000);
  }
}
// Endpoint para recibir calificaciones
app.post('/rate', async (req, res) => {
  try {
    // NEW fields
    const { userId, movieId, movieName, year, rating, comment } = req.body;

    // Validaciones
    if (!userId || !movieId || rating === undefined) {
      return res.status(400).json({
        error: 'Faltan parámetros requeridos: userId, movieId, rating'
      });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'La calificación debe estar entre 1 y 5'
      });
    }

    // Crear el mensaje de calificación
    const calificacion = {
      userId,
      movieId,
      movieName,      // ← NEW
      year,           // ← NEW
      rating,
      comment: comment || '',
      timestamp: new Date().toISOString()
    };

    console.log('[Calificacion] Nueva calificación recibida:', calificacion);

    // … (RabbitMQ part unchanged) …
    const message = JSON.stringify(calificacion);
    channel.sendToQueue(
      QUEUE_NAME,
      Buffer.from(message),
      { persistent: true }
    );

    res.status(201).json({
      success: true,
      message: 'Calificación procesada exitosamente',
      data: calificacion
    });
  } catch (error) {
    console.error('[Calificacion] Error procesando calificación:', error.message);
    res.status(500).json({
      error: 'Error al procesar la calificación',
      details: error.message
    });
  }
});

// Endpoint para obtener estadísticas (opcional)
app.get('/stats', (req, res) => {
  res.json({
    service: 'calificacion',
    rabbitmq_connected: channel !== null,
    queue: QUEUE_NAME
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'calificacion',
    rabbitmq: channel !== null ? 'connected' : 'disconnected'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`[Calificacion] Microservicio corriendo en puerto ${PORT}`);
  connectRabbitMQ();
});
