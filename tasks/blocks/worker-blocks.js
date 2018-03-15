var Web3 = require('web3');
let models = require('/app/models/models.js');
let settings = require('/app/settings/settings.js');
var scanner = require('./scanner.js');
let mongoose = require('mongoose');

var web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));

const mongo = mongoose.connect(`mongodb://${settings.mongo}`);

async function get_block() {
    let latest_block_db = await models.Block.findOne({
        scann: true
    }).sort({number: -1});

    if (latest_block_db == 'undefined') {
        if (settings.default_block == 'undefined') {
            return 0
        } else {
            return settings.default_block
        }
    } else {
        return latest_block_db.number
    }

}

async function start_scann_blocks() {
        const latest_number_db = await get_block()
        const latest_block_node = await web3.eth.getBlock('latest');
        setTimeout(function(){
            for (let i = 1896647; i < 1896649; i++) {
                // console.log(i)
                scanner.scannBlock(i)
            }
            start_scann_blocks();

       }, 10000);
}

start_scann_blocks()
