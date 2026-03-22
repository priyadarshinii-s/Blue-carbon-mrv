import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import User from './src/models/User';

dotenv.config();

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/blue-carbon-mrv');
    const admin = await User.findOne({ role: 'ADMIN' });
    
    if (!admin) {
        console.error("No admin found");
        process.exit(1);
    }
    
    const token = jwt.sign({ id: admin._id, walletAddress: admin.walletAddress }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });
    
    // Create a 1MB dummy base64 string "data:image/jpeg;base64,....."
    const dummyData = Buffer.alloc(1024 * 1024, 'a').toString('base64');
    const b64 = `data:image/jpeg;base64,${dummyData}`;
    const data = JSON.stringify({ files: [b64] });
    
    console.log(`Payload size: ${(data.length / 1024 / 1024).toFixed(2)} MB`);
    
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
