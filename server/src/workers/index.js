require('dotenv').config();

const ocrWorker = require('./ocrWorker');
const notificationWorker = require('./notificationWorker');

console.log('═══════════════════════════════════════════');
console.log('  VerifyFlow Workers Starting...');
console.log('═══════════════════════════════════════════');
console.log(`  OCR Worker:          ✓ listening on "verification" queue`);
console.log(`  Notification Worker: ✓ listening on "notification" queue`);
console.log(`  Redis:               ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
console.log(`  Database:            ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
console.log('═══════════════════════════════════════════');

// ── Graceful Shutdown ───────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down workers gracefully...`);

  try {
    await Promise.all([
      ocrWorker.close(),
      notificationWorker.close(),
    ]);
    console.log('All workers shut down cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception in worker process:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in worker process:', reason);
  process.exit(1);
});
