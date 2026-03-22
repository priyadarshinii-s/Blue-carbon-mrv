require('dotenv').config();
const https = require('https');
const FormData = require('form-data');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  console.error("Missing Pinata keys in .env");
  process.exit(1);
}

console.log("Found keys, testing Pinata upload...");

const form = new FormData();
const fileBuffer = Buffer.from('Testing Pinata upload', 'utf8');
form.append('file', fileBuffer, {
  filename: 'test.txt',
  contentType: 'text/plain',
});
form.append('pinataMetadata', JSON.stringify({ name: 'test.txt' }));
form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

const url = new URL('https://api.pinata.cloud/pinning/pinFileToIPFS');

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    ...form.getHeaders(),
    pinata_api_key: PINATA_API_KEY,
    pinata_secret_api_key: PINATA_SECRET_KEY,
  },
};

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${body}`);
  });
});

req.on('error', e => console.error("Request Error:", e));
form.pipe(req);
