// ticketscann settings

module.exports = {
    mongo: 'mongo:27017/ticketscan',
    // node_url: "http://185.243.130.88:8545",
    node_url: 'https://rinkeby.infura.io/ApH4G8IfHc6dDz0xQKBa',
    ipfs_url: "https://ipfs.infura.io",
    standart_methods: [
        "getMetadataHash"
    ],
    default_block: 1713950,
    abi: require('./abi.json'),
    sentry: {
        "enabled": false,
        "env": "stage",
        "url": "https://<key>@<url>/<project>"
      },
}