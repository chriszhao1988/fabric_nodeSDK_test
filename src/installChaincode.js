const Client = require("fabric-client");
const fs = require("fs");
const path = require("path");

let client = null;
let tx_id = null;

let chaincodePath = path.join(__dirname,"../chaincode/fabcar/javascript/");
let chaincodeName = "fabcar";
let chaincodeVersion = "1.0";

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

let installChaincode = async () =>{
    client = await getClient();

    tx_id = client.newTransactionID(true);

    let request = {
        chaincodePath: chaincodePath,
        chaincodeId: chaincodeName,
        chaincodeVersion: chaincodeVersion,
        chaincodePackage: '',
        chaincodeType: "node",
        targets: ['peer0.org1.example.com'],
        txId: tx_id
    };
    return client.installChaincode(request);
};

(async()=>{
    let r = await installChaincode();
    console.dir(r);
    let proposalResponses = r[0];
    for(let i in proposalResponses){
        if (proposalResponses && proposalResponses[i].response && proposalResponses[i].response.status === 200) {
            console.dir("install chaincode completed!");
        }
        else{
            console.dir("install chaincode failed!");
            console.dir(proposalResponses[i]);
            return false;
        }
    }
})();