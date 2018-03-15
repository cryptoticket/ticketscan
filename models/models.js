var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var blockSchema = new Schema({
    number : Number,
    created_at : Date,
    updated_at : Date,
    scann : Boolean,
});


var contractSchema = new Schema({
    address : String,
    created_at : Date,
    updated_at : Date,
    is_active : Boolean,
    ipfs: {},
});


var transactionSchema = new Schema({
    address: String,
    created_at : Date,
    block: Number,
    event: String,
    status: Boolean,
    contract: String,
    ipfs: {},
    customer_wallet: String

});


var Block = mongoose.model('Block', blockSchema);
var Contract = mongoose.model('Contract', contractSchema);
var Transaction = mongoose.model('Transaction', transactionSchema);


async function saveBlock(number, scann) {
    try {
        data = {
            number : number,
            created_at : new Date().toISOString(),
            scann : scann,
        }
        await Block.update({number: number}, {$set: data}, {upsert: true})

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
        await Contract.update({address: address}, {$set: data}, {upsert: true})

    } catch (e) {
        console.error(e);
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
        await Transaction.update(
            {address: event.transactionHash}, {$set: data}, {upsert: true}
        )

    } catch (e) {
        console.error(e);
    }
}

module.exports.Block = Block;
module.exports.Contract = Contract;
module.exports.Transaction = Transaction;

module.exports.saveBlock = saveBlock;
module.exports.saveContract = saveContract;
module.exports.saveTransaction = saveTransaction;