const IORedis = require('ioredis');

const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    })
  : new IORedis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

connection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

connection.on('connect', () => {
  console.log('Connected to Redis');
});

module.exports = connection;
