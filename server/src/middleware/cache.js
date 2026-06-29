const redis = require('../config/redis');

/**
 * Redis caching middleware for read-heavy endpoints.
 *
 * @param {string} keyPrefix - Cache key prefix (e.g., 'admin:queue')
 * @param {number} ttl - Time-to-live in seconds (default 30s)
 */
function cacheMiddleware(keyPrefix, ttl = 30) {
  return async (req, res, next) => {
    try {
      // Build a unique cache key from the prefix + query params
      const queryString = JSON.stringify(req.query);
      const cacheKey = `cache:${keyPrefix}:${queryString}`;

      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original res.json and intercept it to cache the response
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis.setex(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
            console.error('Cache set error:', err.message);
          });
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      // Cache miss or Redis error — proceed without caching
      console.error('Cache middleware error:', err.message);
      next();
    }
  };
}

/**
 * Invalidate cache keys by prefix.
 *
 * @param {string} keyPrefix - The prefix to invalidate (e.g., 'admin:queue')
 */
async function invalidateCache(keyPrefix) {
  try {
    const keys = await redis.keys(`cache:${keyPrefix}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Cache invalidation error:', err.message);
  }
}

module.exports = { cacheMiddleware, invalidateCache };
