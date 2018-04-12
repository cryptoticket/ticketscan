var express = require('express');
var Web3 = require('web3');
var bs58 = require('bs58');

var models = require('./models.js');
var settings = require('./settings.json');
var ipfsData = require('./ipfs-data.js');

const app = express(),

mongoURL = process.env.MONGO_URL || 'mongo:27017/crypto_scanner',
mongoose = require('mongoose'),
mongo = mongoose.connect(`mongodb://${mongoURL}`),

nodeURL = process.env.NODE_URL || settings.node_url,
web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));


async function validationsContract(contract_adress) {
    try {

        const contract = await web3.eth.contract(settings.abi);
        const contractInstance = await contract.at(contract_adress);
        const ipfs_adress = await contractInstance.metadata()

        if (typeof(ipfs_adress) === 'string') {
            ipfs_data = await ipfsData.ipfsData(ipfs_adress)
            console.log(ipfs_data)
            await saveContract(contract_adress, ipfs_data)
        } else {
            // console.log('xx')
        }

    } catch (e) {
        // console.error(e);
    }
}

async function checkTransactions(transactions) {
    try {
        for (let address of transactions) {
            const transaction = await web3.eth.getTransaction(address)
            await validationsContract(transaction.to);
        }
    } catch (e) {
      console.error(e);
    }
}

async function saveContract(address, ipfs) {
    try {
        data = {
            created_at : new Date().toISOString(),
            address : address,
            is_active : true,
            ipfs: ipfs,
        }
        await models.Contract.update({address: address}, {$set: data}, {upsert: true})

    } catch (e) {
        console.error(e); // 💩
    }
}


async function saveBlock(number, status) {
    try {
        data = {
            number : number,
            created_at : new Date().toISOString(),
            scann : status,
        }
        await models.Block.update({number: number}, {$set: data}, {upsert: true})

    } catch (e) {
        console.error(e); // 💩
    }
}


async function scannBlocks() {
    let current_block;
    let block_number;
    try {
        // last block db and last block node
        const latest_block_node = await web3.eth.getBlock('latest');
        const latest_block_db = await models.Block.find({
            scann: true
        }).sort({number: -1}).limit(1);

        if (await latest_block_db.count() == 0) {
            block_number = 1
        } else {
            block_number = latest_block_db[0].number
        }
        // scann blocks

        for (var i = block_number; i < latest_block_node.number; i++) {
            let current_block = i

            let block = await web3.eth.getBlock(i);
            await checkTransactions(block.transactions)
            await saveBlock(i, status=true)
            // /console.log(block.number, ' - block scanned')
        }

    } catch (e) {
        await saveBlock(current_block, status=false)
    }
}


async function saveTransaction(event, ipfs, customer_wallet) {
    try {
        data = {
            address: event.transactionHash,
            block: event.blockNumber,
            created_at : new Date().toISOString(),
            event: event.event,
            contract: event.address,
            ipfs: ipfs,
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
        console.log(contracts)
        for (let contract of contracts) {
            const _contract = await web3.eth.contract(settings.abi);
            const contractInstance = await _contract.at(contract.address);

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
                console.log(event)
                let ticket = event.args._ticket;
                let customer_wallet = event.args._to;
                let ipfs_adress = getIpfsHashFromBytes32(ticket);
                let ipfs_data = await ipfsData.ipfsData(ipfs_adress);
                await saveTransaction(event, ipfs_data, customer_wallet)
            }

            eventsFilter.stopWatching();
            console.log('contract scanned')
        }

    } catch (e) {
        console.error(e); // 💩
    }
}

module.exports.scannBlocks = scannBlocks;
module.exports.scannContracts = scannContracts;
