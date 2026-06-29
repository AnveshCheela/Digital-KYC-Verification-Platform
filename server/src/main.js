const app = require('./index.js');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`VerifyFlow API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

require('./workers/index.js');
console.log('VerifyFlow: API Server and Background Worker started concurrently.');
