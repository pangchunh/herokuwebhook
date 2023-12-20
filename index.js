const express = require('express');
const crypto = require('crypto');
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const app = express();

const validSignature = async (req, secret) => {
  const body = JSON.stringify(req.body);
  console.log("Headers: ", JSON.stringify(req.headers))
  const heroku_hmac = req.headers['heroku-webhook-hmac-sha256'];
  console.log(`heroku_hmac: ${heroku_hmac}`)
  if (!heroku_hmac) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const digest = hmac.digest('base64');

  console.log(`digest: ${digest}`)
  
  return digest === heroku_hmac;
}

app.post('/webhook', async (req,res) => {
  const secret = process.env.SECRET;
  console.log("Headers: ", JSON.stringify(req.headers))

  const valid = await validSignature(req, secret);
  if (!valid) {
    res.status(403).send('Invalid Signature');
    return;
  }

  const {data} = req.body;
  console.log(`data: ${JSON.stringify(data)}`)
  const {name, state, management} = data;
  console.log(`name: ${name}`)
  console.log(`state: ${state}`)
  console.log(`management: ${management}`)

  res.status(204).send('OK');

})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));