// var express = require('express');
// var Web3 = require('web3');
// var mongoose = require('mongoose');
// var bs58 = require('bs58');

// var models = require('./models.js');
// var settings = require('./settings.json');
// var ipfsData = require('./ipfs-data.js');

// var app = express();
// var web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));
// var mongo = mongoose.connect('mongodb://mongo:27017/crypto_scanner');
var Web3 = require('web3');
let models = require('/app/models/models.js');
let settings = require('/app/settings/settings.js');
let encoding = require('encoding');
let Iconv = require('iconv').Iconv;;
var web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));


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
            const transaction = await web3.eth.getTransactionReceipt(address)
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

async function xxx(x) {
    try {
        let block = await web3.eth.getBlock(x);
        console.log(block.number)

    } catch (e) {
        console.error(e); // 💩
    }
}


async function scannBlocks() {
    let current_block;
    try {
        // last block db and last block node
        // const latest_block_node = await web3.eth.getBlock('latest');
        // const latest_block_db = await models.Block.find({
        //     scann: true
        // }).sort({number: -1}).limit(1);

        // const latest_block_db = await web3.eth.getBlock(1893735);
        // console.log(latest_block_db[0].number, latest_block_node.number);
        console.log('xxx');

        // scann blocks
        for (var i = 1895322; i < 1905323; i++) {
            let current_block = i

            // let block = await web3.eth.getBlock(i);
            // await checkTransactions(block.transactions)
            // await saveBlock(i, status=true)
            xxx(i)
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
        console.error(e); // 💩
    }
}




module.exports.scannBlocks = scannBlocks;
