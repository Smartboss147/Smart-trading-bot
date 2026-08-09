const WebSocket = require('ws');

const ws = new WebSocket('wss://api.gateio.ws/ws/v4/');
ws.on('open', () => {
  const payload = {
    time: Math.floor(Date.now() / 1000),
    channel: 'spot.tickers',
    event: 'subscribe',
    payload: ['BTC_USDT']
  };
  ws.send(JSON.stringify(payload));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.event === 'update') {
    console.log('Update:', msg.result);
    ws.close();
  }
});
