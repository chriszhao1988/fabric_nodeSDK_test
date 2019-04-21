const shell = require('shelljs');
const path = require("path");

let main = async () => {

    shell.exec('export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH');
    shell.exec('export FABRIC_CFG_PATH=${PWD}');

    shell.rm('-rf', './wallet');
    shell.rm('-rf', '~/.hfc-key-store/*');
    shell.exec("mkdir ~/.hfc-key-store");

    //let type = process.argv[2] || "basic-network";
    //shell.cd(path.join(process.cwd(), "..", "fabric-samples", "first-network"));
    //await shell.exec('yes | ./byfn.sh down');

    await shell.exec('docker rm -f $(docker ps -aq)');
    await shell.exec('yes | docker network prune')
    shell.cd(path.join(process.cwd(), "..", "..", "fabric_node_sdk_connect"));
    await shell.exec('configtxgen -profile OneOrgOrdererGenesis -outputBlock ./config/genesis.block');
    await shell.exec('configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel.tx -channelID mychannel');
    await shell.exec('docker-compose -f docker-compose.yaml up -d');

};

main();