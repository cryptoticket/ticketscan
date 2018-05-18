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
    ipfs_address: String,
});


var transactionSchema = new Schema({
    address: String,
    created_at : Date,
    block: Number,
    event: String,
    scann: Boolean,
    contract: String,
    customer_wallet: String,
    from: String,
    to: String,
    ipfs: {},
    ipfs_address: String,
});

var Block = mongoose.model('Block', blockSchema);
var Contract = mongoose.model('Contract', contractSchema);
var Transaction = mongoose.model('Transaction', transactionSchema);

module.exports.Block = Block;
module.exports.Contract = Contract;
module.exports.Transaction = Transaction;