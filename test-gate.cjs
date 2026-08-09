const { ApiClient, SpotApi } = require('gate-api');
const client = new ApiClient();
const apiKey = process.env.GATE_API_KEY;
const apiSecret = process.env.GATE_API_SECRET;
if (!apiKey || !apiSecret) {
  console.log("No API credentials provided");
  process.exit(0);
}
client.setApiKeySecret(apiKey, apiSecret);
const spotApi = new SpotApi(client);
spotApi.listSpotAccounts().then(res => console.log(res.body)).catch(err => console.error(err.response ? err.response.data : err));
