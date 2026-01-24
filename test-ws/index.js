const WebSocket = require('ws');

const TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Im40STFxY2V0Wi15X291aEpzOGJINSJ9.eyJpc3MiOiJodHRwczovL2Rldi1qdDZuaGVzbHhjdmhqeTJhLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJnb29nbGUtb2F1dGgyfDEwMDAyMjcwNjM5NjQzMjgwODY4NyIsImF1ZCI6WyJodHRwczovL3N0b2NrLXdhdGNoLWFwaSIsImh0dHBzOi8vZGV2LWp0Nm5oZXNseGN2aGp5MmEudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc2OTEyODAxOSwiZXhwIjoxNzY5MTM1MjE5LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiYXpwIjoiVElMd3VNT0o5SHJUSkNYR0hZcTFJQm9QbXROMEFCYWsifQ.DYLJMihwiDDN4frGuaIL7Stw1b4E1HsZcNeKzn7p1S7d5NLbShC-2szxI_Etf3ADpJZELVSVpidQJEB1xFOKdJdX0s1S2smwX72bjv_4sgjod6SlPRWzfildomHJ-LJ0ob2Hw0okRt40K4O6C6lIWS7NBsd7ZFg-GDVkW9mTMwPV7GZCZJTnte4TNapbXb2sE1x4W8E_jZI9aIpXOgaXYU2vB1_ySI3otJL6nEy4ErtL2Lg9d8S4vh2rRROSqsXVI4LiK_94DaCpPAEfmVJd_W6dzc7euNpiaMwcvz0gXqdYezqHcKlscP3UUqV4JIkmjTFFdFVOJbxqVf-q-_e3lw"; // Auth0 ACCESS token
const BASE = process.env.BASE_URL || 'ws://localhost:3000/ws';

const ws = new WebSocket(`${BASE}?token=${encodeURIComponent(TOKEN)}`);

ws.on('open', () => {
  console.log('✅ connected');

ws.send(JSON.stringify({ type: 'subscribe', symbol: 'AAPL' }));
ws.send(JSON.stringify({ type: 'subscribe', symbol: 'MSFT' }));


  console.log('📩 sent subscribe messages (AAPL, MSFT)');
});

ws.on('message', (data) => {
  try {
    console.log('⬇️', JSON.parse(data.toString()));
  } catch {
    console.log('⬇️', data.toString());
  }
});

ws.on('error', (e) => console.log('💥 error:', e.message));
ws.on('close', (code) => console.log('🔌 closed:', code));
