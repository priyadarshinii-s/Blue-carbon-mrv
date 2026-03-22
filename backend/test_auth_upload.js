const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/blue-carbon-mrv');
    const User = require('./src/models/User').default;
    const admin = await mongoose.connection.db.collection('users').findOne({ role: 'ADMIN' });
    
    if (!admin) {
        console.error("No admin found");
        process.exit(1);
    }
    
    require('dotenv').config();
    const token = jwt.sign({ id: admin._id, walletAddress: admin.walletAddress }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    
    const b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const data = JSON.stringify({ files: [b64] });
    
    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/upload/photos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${token}`
      }
    }, res => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          console.log(`Response: ${body}`);
          process.exit(0);
      });
    });
    
    req.on('error', e => { console.error(e); process.exit(1); });
    req.write(data);
    req.end();
  } catch (e) {
      console.error(e);
      process.exit(1);
  }
})();
