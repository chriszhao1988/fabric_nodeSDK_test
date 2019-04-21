const {FileSystemWallet, InMemoryWallet, CouchDBWallet, X509WalletMixin} = require('fabric-network');
const path = require('path');

module.exports = () => {

    const type = process.argv[2] || "file";

    let wallet = null;
    switch (type) {
        case "file":
            const walletPath = path.join(process.cwd(), 'wallet');
            wallet = new FileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`);
            break;
        case "memory":
            wallet = new InMemoryWallet();
            console.log('wallet is save in memory.');
            break;
        case "couch":
        case "couchdb":
        case "db":
            const obj = {url: "http://localhost:5984"};
            wallet = new CouchDBWallet(obj);
            console.log(`wallet URL: ${obj.url}`);
            break;
    }
    return wallet;
}