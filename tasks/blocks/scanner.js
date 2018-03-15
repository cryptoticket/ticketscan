let Web3 = require('web3');
let models = require('/app/models/models.js');
let settings = require('/app/settings/settings.js');
let ipfsData = require('/app/utils/ipfs-data.js');

let web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));


async function validationsContract(contract_adress) {
    const contract = await web3.eth.contract(settings.abi);
    const contractInstance = await contract.at(contract_adress);
    const ipfs_adress = await contractInstance.metadata()
    try {
        if (typeof(ipfs_adress) === 'string') {
            ipfs_data = await ipfsData.ipfsData(ipfs_adress)
            await saveContract(contract_adress, ipfs_data=ipfs_data)
        }
    } catch (e) {
        await saveContract(contract_adress, ipfs_data=null)
    }
}


async function checkTransactions(transactions, block_number) {
    try {
        for (let address of transactions) {
            const transaction = await web3.eth.getTransactionReceipt(address)
            await validationsContract(transaction.to);
        }
    } catch (e) {
        console.error(e);
    }
    await models.saveBlock(block_number, scann=true)
}

async function scannBlock(block_number) {
    await models.saveBlock(block_number, scann=false)
    try {
            let block = await web3.eth.getBlock(block_number);
            await checkTransactions(block.transactions, block_number)

    } catch (e) {
        console.error(e);
        await models.saveBlock(block_number, scann=false)
    }
}


module.exports.scannBlock = scannBlock;
