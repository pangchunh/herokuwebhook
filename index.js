const express = require('express');
const crypto = require('crypto');
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const app = express();

const validSignature = async (req, secret) => {
  const body = JSON.stringify(req.body);
  const heroku_hmac = req.headers['Heroku-Webhook-Hmac-SHA256'];
  if (!heroku_hmac) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = hmac.digest('base64');

  return digest === heroku_hmac;
}

app.post('/webhook', async (req,res) => {
  const secret = process.env.SECRET;
  const valid = await validSignature(req, secret);
  if (!valid) {
    res.status(403).send('Invalid Signature');
    return;
  }
  console.log(req.body);
  res.status(204).send('OK');

})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));