var Web3 = require('web3');
let models = require('/app/models/models.js');
let settings = require('/app/settings/settings.js');
let mongoose = require('mongoose');
let ipfsData = require('/app/utils/ipfs-data.js');

var web3 = new Web3(new Web3.providers.HttpProvider(settings.node_url));

const mongo = mongoose.connect(`mongodb://${settings.mongo}`);

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
                await models.saveTransaction(event, ipfs_data, customer_wallet)
            }

            eventsFilter.stopWatching();
        }

    } catch (e) {
        console.error(e);
    }
}

module.exports.scannContracts = scannContracts;
