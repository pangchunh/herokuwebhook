const express = require('express');
const crypto = require('crypto');
const { assert } = require('console');
require('dotenv').config();
const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());


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

const postToSlack = async (text) => {
  const url = process.env.APPLICATION_EVENTS_SLACK_WEBHOOK_URL
  const body = JSON.stringify({text});
  const headers = {
    'Content-Type': 'application/json',
  }
  const response = await fetch(url, {method: 'POST', body, headers})
  return response;
}

app.post('/webhook', async (req,res) => {
  if (!req.body) {
    return res.status(400).send('Bad Request: Empty request body');
  }

  const secret = process.env.SECRET;
  console.log("Headers: ", JSON.stringify(req.headers))

  const valid = await validSignature(req, secret);
  if (!valid) {
    res.status(403).send('Invalid Signature');
    return;
  }

  const {data} = req.body;
  console.log(`data: ${JSON.stringify(data)}`)
  const {name, state} = data;

  const text = `Application ${name} is now scaling ${state}`;

  const response = await postToSlack(text);
  if (!response.ok) {
    console.log(`Error posting to slack: ${response.status} ${response.statusText}`)
    return res.status(500).send('Error posting to slack');
  }
  res.status(204).send('OK');

})

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));