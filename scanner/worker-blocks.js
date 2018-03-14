var express = require('express');
var Web3 = require('web3');
const pug = require('pug');

var models = require('./models.js');
var scanner = require('./scanner.js');
var settings = require('./settings.json');
var ipfsData = require('./ipfs-data.js');

var app = express();
var web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));

const mongoURL = process.env.MONGO_URL || 'mongo:27017/crypto_scanner',
      mongoose = require('mongoose'),
      mongo = mongoose.connect(`mongodb://${mongoURL}`);


app.set('settings', settings);
app.set('web3', web3);
app.set('view engine', 'pug');
app.set('mongo', mongo);

app.use(express.static('public'));
app.use('/static', express.static(__dirname + '/public'));

app.locals.moment = require('moment');




console.log('Start Blocks Scan')
setInterval(scanner.scannBlocks, 60000)
// setInterval(scanner.scannContracts, 10000)
