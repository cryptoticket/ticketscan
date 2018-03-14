var Web3 = require('web3');
let models = require('/app/models/models.js');
let settings = require('/app/settings/settings.js');
var scanner = require('./scanner.js');
let mongoose = require('mongoose');

var web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));

const mongo = mongoose.connect(`mongodb://${settings.mongo}`);


function start_scann_blocks() {
        setTimeout(function(){

            scanner.scannBlocks()
            start_scann_blocks();

       }, 10000);
}

start_scann_blocks()
