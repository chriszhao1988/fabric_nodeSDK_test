/**
 *@desc 执行upgradeChaincode 需要改动installChaincode的版本号 并执行 再执行此js
 *@author Chris.Zhao
 *@date 2019/4/18
 */

const Client = require("fabric-client");
const fs = require("fs");
const path = require("path");

const channelName = "mychannel";
let client = null;
let channel = null;
let tx_id = null;
let eventhubs = [];
let request = null;

let chaincodeName = "fabcar";
let chaincodeVersion = "1.2";

let getClient = () => new Promise((resolve, reject) => {
    /**
     *@desc 初始化client
     *@author Chris.Zhao
     *@date 2019/4/18
     */
    let configfile = path.join(__dirname, '../network-config.yaml');

    let client = Client.loadFromConfig(configfile);
    client.loadFromConfig(path.join(__dirname, '../Org1.yaml'));

    return client.initCredentialStores().then((nothing) => {
        return resolve(client);
    });
});

let upgradeChaincode = async () => {
    client = await getClient();
    channel = client.getChannel(channelName);
    tx_id = client.newTransactionID(true);

    eventhubs = channel.getChannelEventHubsForOrg();

    request = {
        chaincodeId: chaincodeName,
        chaincodeVersion: chaincodeVersion,
        targets: ['peer0.org1.example.com'],
        fcn: "initLedger",
        args: [],
        txId: tx_id,
        chaincodeType: "node",
    };
    let r1 = await channel.sendUpgradeProposal(request, 120000);
    console.dir(r1);
    let proposalResponses = r1[0];
    let proposal = r1[1];
    let all_good = true;
    let isExist = 0;
    for (let i in proposalResponses) {
        let one_good = false;
        if (proposalResponses && proposalResponses[i].response && proposalResponses[i].response.status === 200) {
            // special check only to test transient map support during chaincode upgrade
            one_good = true;
            console.info( 'instantiate proposal was good');
        } else {
            if (proposalResponses[i].details && proposalResponses[i].details.indexOf("exists") != -1) {
                console.info("Chaincode is exists. Continue...");
                isExist++;
            }
            else if (proposalResponses[i].response && proposalResponses[i].response && proposalResponses[i].response.hasOwnProperty("message") && proposalResponses[i].response.message.indexOf("exists") != -1) {
                console.info("Chaincode is exists. Continue...");
                isExist++;
            }
            else {
                console.error('instantiate proposal was bad');
            }
        }
        all_good = all_good & one_good;
    }
    if (isExist == proposalResponses.length) return "exist";
    if (all_good) {
        request = {
            proposalResponses: proposalResponses,
            proposal: proposal,
            admin: true,
            txId: tx_id
        };

        let deployId = tx_id.getTransactionID(true);

        let eventPromises = [];
        eventhubs.forEach((eh) => {
            let txPromise = new Promise((resolve, reject) => {
                let handle = setTimeout(() => {
                    eh.unregisterTxEvent(deployId);
                    eh.disconnect();
                    reject(new Error('REQUEST_TIMEOUT:' + eh._peer._endpoint.addr));
                }, 120000);
                eh.registerTxEvent(deployId.toString(), (tx, code, block_num) => {
                    clearTimeout(handle);
                    eh.unregisterTxEvent(deployId);

                    if (code !== 'VALID') {
                        reject(new Error('INVALID:' + code));
                    } else {
                        resolve('COMMITTED');
                    }
                }, (err) => {
                    clearTimeout(handle);
                    eh.unregisterTxEvent(deployId);
                    reject(err);
                });
            });
            console.info('register eventhub %s with tx=%s', eh.getPeerAddr(), deployId);
            eventPromises.push(txPromise);
            eh.connect(true);
        });

        var sendPromise = channel.sendTransaction(request);
        let r2 = await Promise.all([sendPromise].concat(eventPromises));
        if (typeof r2 != Array && r2 == "exist") {
            console.info("The chaincode is exist in this channel");
            return {status: "chaincode exists"};
        } else {
            let sendTransaction_results = r2[0]; // Promise all will return the results in order of the of Array
            let event_results = r2[1];
            if (sendTransaction_results instanceof Error) {
                console.error('Failed to order the transaction: ' + sendTransaction_results);
                throw sendTransaction_results;
            } else if (sendTransaction_results.status === 'SUCCESS') {
                console.info('Successfully sent transaction to instantiate the chaincode to the orderer.');
                return {status: "Instantiate chaincode successfully", tx_id: tx_id.getTransactionID(true)}
            } else {
                console.error('Failed to order the transaction to instantiate the chaincode. Error code: ' + sendTransaction_results.status);
                throw new Error('Failed to order the transaction to instantiate the chaincode. Error code: ' + sendTransaction_results.status);
            }
        }
    } else {
        console.error("Bad Proposals");
        return false;
    }

};

(async () => {
    await upgradeChaincode();
})();