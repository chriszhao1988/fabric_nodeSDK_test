/**
 *@desc 基于basic-network 的 fabcar nodejsSDK 实验   -- create and join channel
 *@author Chris.Zhao
 *@date 2019/4/18
 */

/**
 *@desc 实验环境
 * cd first-network
 * ./byfn down
 * cd ../basic-network
 * configtxgen -profile OneOrgOrdererGenesis -outputBlock ./config/genesis.block
 * configtxgen -profile OneOrgChannel -outputCreateChannelTx ./config/channel.tx -channelID mychannel
 * docker-compose -f docker-compose.yml up -d
 *@author Chris.Zhao
 *@date 2019/4/18
 */

const Client = require("fabric-client");
const fs = require("fs");
const path = require("path");

let signatures = [];
const channelName = "mychannel";
let channel = null;
let client = null;

let getClient = () => new Promise((resolve, reject) => {
    /**
     *@desc 初始化client
     *@author Chris.Zhao
     *@date 2019/4/18
     */
    let configfile = path.join(__dirname, '../network-config.yaml');

    let client = Client.loadFromConfig(configfile);
    client.loadFromConfig(path.join(__dirname, '../Org1.yaml'));

    /**
     *@desc 当测试环境启用grpcs时
     * let clientKey = fs.readFileSync(path.join(__dirname, 'somepath/tls/client.key'));
     * let clientCert = fs.readFileSync(path.join(__dirname, 'somepath/tls/client.crt'));

     * client.setTlsClientCertAndKey(Buffer.from(clientCert).toString(), Buffer.from(clientKey).toString());
     *@author Chris.Zhao
     *@date 2019/4/18
     */

   /* let clientKey = fs.readFileSync(path.join(__dirname, '../crypto-config/ordererOrganizations/example.com/users/Admin@example.com/tls/client.key'));
    let clientCert = fs.readFileSync(path.join(__dirname, '../crypto-config/ordererOrganizations/example.com/users/Admin@example.com/tls/client.crt'));
    client.setTlsClientCertAndKey(Buffer.from(clientCert).toString(), Buffer.from(clientKey).toString());*/

    return client.initCredentialStores().then((nothing) => {
        return resolve(client);
    });
});


let getOrderer = (...args) => {
    return 'orderer.example.com';
}


let createChannel = async () => {
    try {
        client = await getClient();

        /**
         *@desc use the fabric-client SDK to extract the sign-able channel definition from the initial binary channel configuration definition
         * 使用fabric-client SDK 从二进制设置定义文件 取得可签名的channel定义
         *@author Chris.Zhao
         *@date 2019/4/18
         */
        let envelope_bytes = fs.readFileSync(path.join(__dirname, "../config/channel.tx"));
        let config = client.extractChannelConfig(envelope_bytes);
        /**
         *@desc use the fabric-client SDK to sign the sign-able channel definition
         *@author Chris.Zhao
         *@date 2019/4/18
         */
        let signature1 = client.signChannelConfig(config);

        let string_signature1 = signature1.toBuffer().toString('hex');
        signatures.push(string_signature1);

        /**
         *@desc use the fabric-client SDK to send the signatures and the sign-able channel definition to the orderer
         *@author Chris.Zhao
         *@date 2019/4/18
         */
        let tx_id = client.newTransactionID(true);
        let request = {
            config: config,
            signatures: signatures,
            name: channelName,
            orderer: getOrderer(client, 0),
            txId: tx_id
        };
        return client.createChannel(request);
    } catch (e) {
        throw e;
    }
};

let joinChannel = async () => {

    if(!client) client = await getClient();
    /**
     *@desc use the fabric-client SDK to have the peer join the channel
     *@author Chris.Zhao
     *@date 2019/4/18
     */
    channel = client.getChannel(channelName);

    let tx_id = client.newTransactionID(true);
    let request = {
        txId: tx_id
    };

    let block = await channel.getGenesisBlock(request);
    tx_id = client.newTransactionID(true);
    request = {
        targets: ['peer0.org1.example.com'],
        block: block,
        txId: tx_id
    };
    return channel.joinChannel(request);
};

(async () => {

    let r = await createChannel();
    console.info(' response ::%j', r);
    if (r.status && r.status === 'SUCCESS') {
        console.dir({status: "Create channel successfully"});
    } else {
        console.dir({status: "Create channel failed"});
        console.dir(r);
        return false;
    }


    let r2 = await joinChannel();
    let proposalResponses = r2;
    for (let i in proposalResponses) {
        if (proposalResponses && proposalResponses[i].response && proposalResponses[i].response.status === 200) {
            console.dir("join channel proposal was good!");
        }
        else {
            console.dir("join channel proposal failed!");
            console.dir(proposalResponses[i]);
            return false;
        }
    }

})();