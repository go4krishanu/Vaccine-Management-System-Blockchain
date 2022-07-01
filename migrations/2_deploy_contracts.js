var Vaccine = artifacts.require("./Vaccine.sol");
module.exports = function(deployer) {
  deployer.deploy(Vaccine);
};
