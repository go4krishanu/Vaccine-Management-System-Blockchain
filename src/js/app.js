var contractsGlobal = null;
var  web3Provider= null
var contracts= {}
var account = '0x0'
var vaccineInstance = null;



function initWeb3() {
  // TODO: refactor conditional
  if (typeof web3 !== 'undefined') {
    // If a web3 instance is already provided by Meta Mask.
    web3Provider = web3.currentProvider;
    web3 = new Web3(web3.currentProvider);
  } else {
    // Specify default instance if no web3 instance provided
   web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    web3 = new Web3(App.web3Provider);
  }
  return initContract();
}

function initContract() {
    $.getJSON("Vaccine.json", function(Vaccine) {
      // Instantiate a new truffle contract from the artifact
      contractsGlobal = TruffleContract(Vaccine);
      // Connect provider to interact with contract
      contractsGlobal.setProvider(web3Provider);
      console.log(contractsGlobal)
      listenForEvents();

      return render();
    });
}

  // Listen for events emitted from the contract
function listenForEvents() {
  contractsGlobal.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.vaccineEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        render();
      });
    });
  }

function render() {
    var loader = $("#loader");
    var content = $("#content");
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, acc) {
      if (err === null) {
        account = acc;
        $("#accountAddress").html(acc);
      }
    });

    // Load contract data
    contractsGlobal.deployed({'from' :account}).then(function(instance) {
      vaccineInstance = instance;
      return vaccineInstance.citizenCount();
    })
    .then(function(citizenCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      for (var i = 0; i < citizenCount; i++) {
        
        vaccineInstance.Citizens(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + candidate[2] + "</td><td>" + candidate[3] + "</td><td>" + candidate[5] + "</td></tr>"
          candidatesResults.append(candidateTemplate);
        });
      }
    }).catch(function(error) {
      console.warn(error);
    });

    contractsGlobal.deployed({'from' :account}).then(function(instance) {
      vaccineInstance = instance;
      return vaccineInstance.hospitalCount();
    })
    .then(function(hospitalCount) {
      var candidatesResults = $("#candidatesResults1");
      var hospitalAppointment = $("#hospitalAppointment");
      var hospitalForValidate = $("#hospitalForValidate");
      
      candidatesResults.empty();
      for (var i = 0; i < hospitalCount; i++) {
        vaccineInstance.HospitalsID(i).then(function(hospital) {
          console.log(hospital);
          var candidateTemplate = "<tr><th>" + hospital[0] + "</th><td>" + hospital[1] + "</td><td>" + hospital[2] + "</td><td>" + hospital[3] + "</td><td>" + hospital[4] + "</td><td>" + hospital[5]+"</td><td>" + hospital[7]+"</td></tr>"
          var hospitalName = `<option value="`+ hospital[0]+`">`+ hospital[1]+`</option>`
          candidatesResults.append(candidateTemplate);
          hospitalAppointment.append(hospitalName);
          hospitalForValidate.append(hospitalName);
        });
      }
    }).catch(function(error) {
      console.warn(error);
    });

    contractsGlobal.deployed({'from' :account}).then(function(instance) {
      vaccineInstance = instance;
      return vaccineInstance.manufacturerCount();
    })
    .then(function(manufacturerCount) {
      var candidatesResults = $("#candidatesResults2");
      candidatesResults.empty();
      var manufacturerAppointment = $("#manufacturerAppointment");
      var manufacturerForValidate = $("#manufacturerForValidate");


      for (var i = 0; i < manufacturerCount; i++) {
        vaccineInstance.ManufacturersID(i).then(function(hospital) {
          console.log(hospital);
          var candidateTemplate = "<tr><th>" + hospital[0] + "</th><td>" + hospital[1] + "</td><td>" + hospital[2] + "</td><td>" + hospital[3] + "</td><td>" + hospital[4] + "</td><td>"+ hospital[8] + "</td><td>" + hospital[5]+"</td><td>" + hospital[6]+"</td></tr>"
          var manufacturer = `<option value="`+ hospital[0]+`">`+ hospital[1]+`</option>`
          candidatesResults.append(candidateTemplate);
          console.log(manufacturer)
          manufacturerAppointment.append(manufacturer);
          manufacturerForValidate.append(manufacturer);
        });
      }
    }).catch(function(error) {
      console.warn(error);
    });

    contractsGlobal.deployed({'from' :account}).then(function(instance) {
      vaccineInstance = instance;
      return vaccineInstance.appointmentCount();
    })
    .then(function(appointmentCount) {
      var candidatesResults = $("#candidatesResults3");
      candidatesResults.empty();
      var appointmentList = $("#appointmentList");


      for (var i = 0; i <appointmentCount; i++) {
        vaccineInstance.Appointments(i).then(function(hospital) {
          var candidateTemplate = "<tr><th>" + hospital[0] + "</th><td>" + hospital[1] + "</td><td>" + hospital[3] + "</td><td>" + hospital[5] + "</td><td>" + hospital[6]+"</td><td>" + hospital[7]+"</td></tr>"
          candidatesResults.append(candidateTemplate);
          var citizenId = hospital[3];
          var hospitalId = hospital[5];
          citizenId= web3.fromWei(citizenId.toNumber(), "ether" );
          hospitalId= web3.fromWei(hospitalId.toNumber(), "ether" );    
          var res = `<option value="`+ hospital[0]+"\">";
          vaccineInstance.HospitalsID(hospitalId).then(function(hosp){res += hosp[1]; res += "-";})
          vaccineInstance.Citizens(citizenId).then(function(hosp){res += hosp[1];res += "</option>";
          appointmentList.append(res);})
          
        });
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  }
  

initWeb3();
function registerCitizen(){
  var name = document.getElementById('citizenName').value;
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.registerCitizen(name,{'from':account}).then(function(args){
        console.log(args);
    });
  });
}

function registerHospital(){
  var name = document.getElementById('hospitalName').value;
  var vaccine = document.getElementById('hospitalVaccine').value;
  var nabhId = document.getElementById('nabhId').value;
  var doseCost = document.getElementById('doseCost').value;

  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.registerHospital(name,vaccine,nabhId,doseCost,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}

function registerCitizen(){
  var name = document.getElementById('citizenName').value;
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.registerCitizen(name,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}

function bookAppointment(){
  var hospitalId=parseInt(document.getElementById("hospitalAppointment").value);
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, '0');
  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
  var yyyy = today.getFullYear();
  today = mm + '/' + dd + '/' + yyyy;
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.bookAppointment(today,hospitalId,{'from':account}).then(function(args){
        window.location.reload();
    });
  });
}


function registerManufacturer(){
  var name = document.getElementById('manufacturerName').value;
  var vaccine = document.getElementById('manufacturerVaccine').value;
  var gstNo = document.getElementById('gstNo').value;
  var doseCost = document.getElementById('doseCost1').value;

  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.registerManufacturer(name,vaccine,gstNo,doseCost,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}

function addSupply(){
  var quantity = parseInt(document.getElementById('quantity').value);
  console.log(quantity,account)
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.addSupply(quantity,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}

function placVaccineOrder(){
  var quantityVaccine = parseInt(document.getElementById("quantityVaccine").value);
  var ManufacturersID = parseInt(document.getElementById("manufacturerAppointment").value)
  console.log(quantityVaccine,ManufacturersID)
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.placeVaccineOrder(ManufacturersID,quantityVaccine,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}


function validatHospital(){
  var hospitalId = parseInt(document.getElementById("hospitalForValidate").value);
  
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.validateHospital(hospitalId,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });

}



function validateManufacturer(){
  var hospitalId=parseInt(document.getElementById("manufacturerForValidate").value);
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.validateManufacturer(hospitalId,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}


function vaccinateCitizen(){
  var appointmentId = parseInt(document.getElementById("appointmentList").value)
  contractsGlobal.deployed({'from' :account}).then(function(instance) {
    vaccineInstance = instance;
    vaccineInstance.vaccinateCitizen(appointmentId,{'from':account}).then(function(args){
        console.log(args);
        window.location.reload();
    });
  });
}