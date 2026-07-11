const http = require('http');
const body = JSON.stringify({
  decision: 'accepted',
  nom: 'Test',
  prenom: 'Partner',
  date_naissance: '1990-01-01',
  email: 'partner@test.com',
  telephone: '+33100000000',
  signature: 'data:image/png;base64,abc',
  message: ''
});
const req = http.request({
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/contracts/token/e482575c60dd41008fda3ec305368ae6/decision',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  }
}, (res) => {
  console.log('status', res.statusCode);
  let data = '';
  res.setEncoding('utf8');
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(data);
  });
});
req.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
req.write(body);
req.end();
