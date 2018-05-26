var express = require('express');
var Web3 = require('web3');
const pug = require('pug');
const Agenda = require('agenda');

var models = require('./models.js');
var settings = require('./settings.json');
var ipfsData = require('./ipfs-data.js');

const app = express();



mongoURL = process.env.MONGO_URL || 'mongo:27017/crypto_scanner',
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

console.log('Start Blocks Scan')


async function checkBlocks() {
    let contract_adress;
    try {
        // last block db and last block node
        let block_node = await web3.eth.getBlock('latest');
        let block_db = await models.Block.find({
            scann: true
        }).sort({number: -1}).limit(1);


        if (block_db.length == 0) {
            block_db = 0
        } else {
            block_db = block_db[0].number
        }
        // scann blocks
        if (block_db < block_node.number) {

            let block = await web3.eth.getBlock(block_db+1);

            for (let address of block.transactions) {
                const transaction = await web3.eth.getTransaction(address)

                if (transaction.to === null) {
                    const t = await web3.eth.getTransactionReceipt(address)
                    contract_adress = t.contractAddress
                } else {
                    contract_adress = transaction.to
                }

                const contract = await web3.eth.contract(settings.abi);
                const contractInstance = await contract.at(contract_adress);
                const ipfs_adress = await contractInstance.metadata()

                if (typeof(ipfs_adress) === 'string') {
                    await saveContract(contract_adress, ipfs_adress)
                }

                await saveTransaction(address, transaction)
            }

            await saveBlock(block)
            console.log("scann block -", block_db+1)

        }

    } catch (e) {
        // await saveBlock(current_block, status=false)
    }
}

async function saveTransaction(address, transaction) {
    await models.Transaction.update(
        {
            address: address
        },
        {
            $set: {
                adress : address,
                created_at : new Date().toISOString(),
                scann : false,
                block: transaction.blockNumber,
                to: transaction.to,
                from: transaction.from,
            }
        },
        {
            upsert: true
        }
    )
}

async function saveBlock(block) {
    await models.Block.update(
        {
            number: block.number
        },
        {
            $set: {
                number : block.number,
                created_at : new Date().toISOString(),
                scann : true,
            }
        },
        {
            upsert: true
        }
    )
}

async function saveContract(address, ipfs_address) {
    try {
        data = {
            created_at : new Date().toISOString(),
            address : address,
            is_active : true,
            ipfs_address: ipfs_address,
        }
        await models.Contract.update(
            {address: address}, {$set: data}, {upsert: true}
        )

    } catch (e) {
        console.error(e);
    }
}



async function getIPFSdata() {
    try {
        let contracts = await models.Contract.find({
            ipfs: {$exists:false}
        })
        for (let contract of contracts) {
            ipfs_data = await ipfsData.ipfsData(contract.ipfs_address)
            await models.Contract.update(
                {address: contract.address},
                 {$set: {ipfs: ipfs_data}},
                 {upsert: true}
            )

            console.log("get ipfs data for contract ", contract.address);
        }


    } catch (e) {
        // await saveBlock(current_block, status=false)
    }
}


agenda.define('check_blocks', function(job) {
    checkBlocks();
    console.log('run worker blocks')
});

agenda.define('get_ipfs_data', function(job) {
    getIPFSdata()
});

agenda.on('ready', function() {
    agenda.every('4 seconds', 'check_blocks');
    agenda.every('25 seconds', 'get_ipfs_data');
    agenda.start();
});
