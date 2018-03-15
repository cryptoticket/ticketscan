let ipfsAPI = require('ipfs-api')
let settings = require('/app/settings/settings.js');
let ipfs = new ipfsAPI(settings.ipfs.host, settings.ipfs.port, {protocol: 'https'})



async function ipfsData(address) {
    try {
        const data = {}
        // console.log(address)
        const a = await ipfs.object.get(address)
        for (let link of a.links) {
            if (link.name == 'media') {
                data[link.name] = link.toJSON().multihash
            } else {
                data[link.name] = await ipfsGet(link.name, link.toJSON().multihash)
            }

        }
        return data
    } catch (e) {
        console.error(e);
    }
}


async function ipfsGet(name, address) {

    try {
        d = await ipfs.object.get(address)
        if (d.links.length == 0) {
            const files = await ipfs.files.get(d.toJSON().multihash)
            return files[0].content.toString('utf8')

        } else {
            const data = {}
            for (let link of  d.links) {
                data[link.name] = await ipfsGet(link.name, link.toJSON().multihash)

            }
            return data

        }
    } catch (e) {
        console.error(e);
    }

}


module.exports.ipfsData = ipfsData;