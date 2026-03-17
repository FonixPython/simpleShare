#!/usr/bin/env node

const http = require('http');

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
const updating = process.argv[2] === 'true';
const message = process.argv[3] || '';

const data = JSON.stringify({
  updating,
  message
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/update-status',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();

console.log(`Setting update status to: ${updating ? 'updating' : 'not updating'}`);
if (message) {
  console.log(`Message: ${message}`);
}
