const fs = require('fs');
const http = require('http');

// Create a dummy base64 image (1x1 transparent PNG)
const b64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const data = JSON.stringify({ files: [b64] });

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/upload/photos',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
