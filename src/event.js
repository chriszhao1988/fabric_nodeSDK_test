
const { Gateway } = require('fabric-network');
const ccp = require('./common/ccp')();
const wallet = require('./common/wallet')();

let blockEventTest = async () =>{
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');

    /**
     * @param {String} listenerName the name of the event listener
     * @param {Function} callback the callback function with signature (error, blockNumber, transactionId, status)
     * @param {Object} options
     **/
    const listener = await network.addBlockListener('my-block-listener', (error, block) => {
        if (error) {
            console.error(error);
            return;
        }
        console.dir(block);
    }, {filtered: true /*false*/})
};

/*let contractEventTest = async () =>{
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');

    /!**
     * @param {String} listenerName the name of the event listener
     * @param {String} eventName the name of the event being listened to
     * @param {Function} callback the callback function with signature (error, event, blockNumber, transactionId, status)
     * @param {Object} options
     **!/
    const listener = await contract.addContractListener('my-contract-listener', 'sale', (error, event, blockNumber, transactionId, status) => {
        if (error) {
            console.error(error);
            return;
        }
        console.log('contractEventTest')
        console.log(`Block Number: ${blockNumber} Transaction ID: ${transactionId} Status: ${status}`);
    })
};*/
/**
 *@desc
 * 这里是按照https://fabric-sdk-node.github.io/release-1.4/tutorial-listening-to-events.html 所写
 * 但是 执行中会报 TypeError: contract.newTransaction is not a function..      ***原因不明***
 *@author Chris.Zhao
 *@date 2019/4/21
 */
/*let CommitEventTest = async () =>{
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: false } });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('fabcar');

    const transaction = contract.newTransaction('createCar');
    /!**
     * @param {String} transactionId the name of the event listener
     * @param {Function} callback the callback function with signature (error, transactionId, status, blockNumber)
     * @param {Object} options
     **!/
    const listener = await transaction.addCommitListener((error, transactionId, status, blockNumber) => {
        if (error) {
            console.error(error);
            return;
        }
        console.log(`Transaction ID: ${transactionId} Status: ${status} Block number: ${blockNumber}`);
    });
}*/

blockEventTest();
//contractEventTest();
//CommitEventTest();


//module.exports = blockEventTest;
