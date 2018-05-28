var express = require('express');
var Web3 = require('web3');
const pug = require('pug');
const Agenda = require('agenda');
var bs58 = require('bs58');

var models = require('./models.js');
var settings = require('./settings.json');
var ipfsData = require('./ipfs-data.js');

const app = express(),

mongoURL = process.env.MONGO_URL || 'mongo:27017/scanner',
mongoose = require('mongoose'),
mongo = mongoose.connect(`mongodb://${mongoURL}`),

nodeURL = process.env.NODE_URL || settings.node_url,
web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));

var agenda = new Agenda({db: {address: mongoURL}});

app.set('settings', settings);
app.set('web3', web3);
app.set('view engine', 'pug');
app.set('mongo', mongo);

app.use(express.static('public'));
app.use('/static', express.static(__dirname + '/public'));

app.locals.moment = require('moment');

console.log('Start Contracts Scan')


async function saveTransaction(event, ipfs, customer_wallet, ipfs_address) {
    try {
        data = {
            address: event.transactionHash,
            block: event.blockNumber,
            created_at : new Date().toISOString(),
            event: event.event,
            contract: event.address,
            ipfs: ipfs,
            ipfs_address: ipfs_address,
            customer_wallet:customer_wallet
        }
        await models.Transaction.update(
            {address: event.transactionHash}, {$set: data}, {upsert: true}
        )

    } catch (e) {
        console.error(e);
    }
}

function getIpfsHashFromBytes32(ticket) {
    const hashHex = "1220" + ticket.slice(2)
    const hashBytes = Buffer.from(hashHex, 'hex');
    const hashStr = bs58.encode(hashBytes)
    return hashStr
 }


async function scannContracts() {
    try {
        const contracts = await models.Contract.find({is_active: true});
        for (let contract of contracts) {
            const _contract = await web3.eth.contract(settings.abi);
            const contractInstance = await _contract.at(contract.address);
            try {
                const ipfs_adress = await contractInstance.metadata()
            } catch (error) {
                continue
            }

            let eventsFilter = contractInstance.allEvents({
                fromBlock: 0, toBlock: 'latest'
            });

            const Promisify = (inner) =>
                new Promise((resolve, reject) =>
                    inner((err, res) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(res);
                        }
                    })
                );

            const events = await Promisify(cb => eventsFilter.get(cb));
            for (let event of events) {
                let ticket = event.args._ticket;
                let customer_wallet = event.args._to;
                let ipfs_address = getIpfsHashFromBytes32(ticket);
                let ipfs_data = await ipfsData.ipfsData(ipfs_address);
                await saveTransaction(event, ipfs_data,
                    customer_wallet, ipfs_address)
            }

            eventsFilter.stopWatching();
        }

    } catch (e) {
        console.error(e); // 💩
    }
}

agenda.define('check_contracts', function(job) {
    scannContracts();
    console.log("check contracts");
});


agenda.on('ready', function() {
    agenda.every('25 seconds', 'check_contracts');
    agenda.start();
});
