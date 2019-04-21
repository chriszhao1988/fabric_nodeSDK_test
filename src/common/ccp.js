const yaml = require("js-yaml");
const fs = require("fs");
const path = require("path");
const ccpPath = path.resolve(__dirname, '..','..', 'network-config.yaml');

module.exports = ()=>{

    const ccpYaml = fs.readFileSync(ccpPath, 'utf8');

    let ccpJSON = null;
    try {
        ccpJSON = yaml.safeLoad(ccpYaml);
    } catch (e) {
        throw e;
    }
    return ccpJSON;

};