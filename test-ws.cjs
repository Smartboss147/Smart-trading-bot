const WebSocket = require('ws');

const ws = new WebSocket('wss://api.gateio.ws/ws/v4/');
ws.on('open', () => {
  console.log('Connected to Gate.io WS');
  const payload = {
    time: Math.floor(Date.now() / 1000),
    channel: 'spot.tickers',
    event: 'subscribe',
    payload: ['BTC_USDT', 'ETH_USDT']
  };
  ws.send(JSON.stringify(payload));
});

ws.on('message', (data) => {
  console.log('Message from Gate.io:', data.toString());
  ws.close();
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});
