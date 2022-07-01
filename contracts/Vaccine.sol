// SPDX-License-Identifier: MIT

pragma solidity ^0.5.16;

contract Vaccine {

    // ---GOVERNMENT CONTROL---
    // Government
    address government;
    
    // Set the contract creator as government
    constructor() public {
        government = msg.sender;
    }
    
    // Returrn the governments public addrerss
    function getGovernment() public view returns (address) {
        return government;
    }
    
    // Get status of citizen - only government can access this data
    function getCitizenStatus(uint index) public view onlyGovernment returns (string memory, string memory, bool) {
        return (Citizens[index].name, Citizens[index].vaccine, Citizens[index].vaccinated);
    }
    
    // Grant hospital permission to vaccinate
    function validateHospital(uint hospitalId) public onlyGovernment {
        Hospital storage hospital = HospitalsID[hospitalId]; // Fetch associated hospital
        hospital.isValidated = true; // Validate hospital
    }

    function validateManufacturer(uint Id) public onlyGovernment {
        Manufacturer storage manufacturer = ManufacturersID[Id];
        manufacturer.isValidated = true; // Validate hospital
    }
    
    
    // Custom modifier to enable only the government to access certain data
    modifier onlyGovernment() {
        require(msg.sender == government);
        _;
    }
    // ---END GOVERNMENT CONTROL---
    
    event vaccineEvent();
    
    
    
    // ---VARIABLES---
    // Variables to keep track of instance counts
    uint public manufacturerCount;
    uint public citizenCount;
    uint public hospitalCount;
    uint public appointmentCount;
    
    // Mappings to keep track of structs
    mapping(address => Manufacturer) public Manufacturers; // Mapping that holds records of all manufacturers
    mapping(uint => Manufacturer) public ManufacturersID; // Mapping that holds records of all manufacturers by id
    mapping(address => Hospital) public Hospitals; // Mapping that holds records of all hospitals
    mapping(uint => Hospital) public HospitalsID; // Mapping that holds records of all hospitals by id
    mapping(address => Citizen) public CitizensAddress; // Mapping that holds records of all citizens by address
    mapping(uint => Citizen) public Citizens; // Mapping that holds records of all citizens 
    mapping(uint => Appointment) public Appointments; // Mapping that holds records of all appointments 

    // Structs for Hospital, Manufacturers, Citizens and Appointments
    struct Hospital {
        uint id;
        string name;
        address payable owner;
        bool isValidated;
        string vaccine;
        uint stock;
        uint nabhID;
        uint doseCost;
    }
    
    struct Manufacturer {
        uint id;
        string name;
        address payable owner;
        string vaccine;
        uint capacity;
        uint gstNo;
        uint doseCost;
        bool isCreated;
        bool isValidated;
    }
    
    struct Citizen {
        uint id;
        string name;
        address publicAddress;
        string vaccine;
        bool vaccinated;
        uint doses;
        bool isCreated;
    }
    
    struct Appointment {
        uint id;
        string date;
        address citizen;
        uint citizenId;
        address payable hospital;
        uint hospitalId;
        string vaccine;
        uint doseCount;
        bool vaccinated;
    }
    // ---END VARIABLES---
    
    
    
    // ---CITIZEN METHODS---
    // Citizen register themselves for vaccination
    function registerCitizen(string memory name) public {
        Citizen memory citizen = Citizen(citizenCount, name, msg.sender, "Not Vaccinated", false, 0, true); // Create new citizen 
        Citizens[citizenCount] = citizen; // Pass instance to mapping
        CitizensAddress[msg.sender] = citizen; // Pass instance to mapping
        citizenCount++; // Increment identifier for subsequent creation
    }
    
    function bookAppointment(string memory date, uint hospitalID) public payable {
        address payable hospitalAddress = getHospitalAddress(hospitalID);
        require(CitizensAddress[msg.sender].vaccinated == false, "You are already vaccinated!");
        require(HospitalsID[Hospitals[hospitalAddress].id].stock >= 1, "Not enough stock");
        string memory vaccine = HospitalsID[hospitalID].vaccine;
        Appointment memory appointment = Appointment(appointmentCount, date, msg.sender, CitizensAddress[msg.sender].id, hospitalAddress, 
        hospitalID, vaccine, CitizensAddress[msg.sender].doses+1, false); 

        Appointments[appointmentCount] = appointment; 
        appointmentCount++; 
        
        hospitalAddress.transfer(msg.value); // Pay for vaccine
    }

     function getHospitalAddress(uint hospitalsID) public view returns (address payable){
        Hospital memory hospital = HospitalsID[hospitalsID];
        return hospital.owner;
    }

    function getManufactruerAddress(uint id) public view returns (address payable){
        Manufacturer memory manufacturer = ManufacturersID[id];
        return manufacturer.owner;
    }
    
    
    
    // ---HOSPITAL METHODS---
    // Register hospital
    function registerHospital(string memory name, string memory vaccine, uint nabhID, uint doseCost) public {
        Hospital memory hospital = Hospital(hospitalCount, name, msg.sender, false, vaccine, 0, nabhID, doseCost); // Create new instance variable 
        Hospitals[msg.sender] = hospital; // Pass instance to mapping 
        HospitalsID[hospitalCount] = hospital; // Pass instance to mapping 

        hospitalCount++; // Increment identifier for subsequent creation
    }
    
    function vaccinateCitizen(uint appointmentId) public {
        Hospital storage hospital = Hospitals[msg.sender]; // Fetch associated hospital
        
        require(msg.sender == hospital.owner, "You are not authorised"); // Only authorised hospitals can vaccinate people
        require(HospitalsID[hospital.id].isValidated == true , "Hospital not authorised by government"); // Only authorised hospitals can vaccinate people
        Appointment storage appointment = Appointments[appointmentId];
        uint citizenID = appointment.citizenId;

        Citizen storage citizen = Citizens[citizenID]; // Fetch associated citizen
        citizen.vaccine = hospital.vaccine; // Set vaccine
        citizen.doses = citizen.doses + 1; // Increment doses
        CitizensAddress[citizen.publicAddress].doses = citizen.doses; // Increment doses
        
        if(citizen.doses == 2){
            CitizensAddress[citizen.publicAddress].vaccinated = true;
            citizen.vaccinated = true;
        }
        
        hospital.stock = hospital.stock - 1; // Reduce vaccine from stock

        Hospital storage hospitalid = HospitalsID[Hospitals[msg.sender].id];
        hospitalid.stock = hospitalid.stock - 1;
        
        Appointments[appointmentId].vaccinated = true; // Set appointment as completed
    }
    
    function placeVaccineOrder(uint manufacturersID, uint quantity) payable public {
        Manufacturer storage manufacturer = ManufacturersID[manufacturersID];
        address payable manufacturerAddress = manufacturer.owner;
        Hospital storage hospital = HospitalsID[Hospitals[msg.sender].id];
        require(quantity <= manufacturer.capacity, "Not enough quantity available");
        require(manufacturer.isValidated==false,"Manufacturer Not Validated");        
        manufacturer.capacity = manufacturer.capacity - quantity;
        hospital.stock = hospital.stock + quantity;
        manufacturerAddress.transfer(msg.value); 
    }
    
    

    function registerManufacturer(string memory name, string memory vaccine, uint gstNo, uint doseCost) public {
        Manufacturer memory manufacturer = Manufacturer(manufacturerCount, name, msg.sender, vaccine, 0, gstNo, doseCost, true,false); // Create new instance variable 
        Manufacturers[msg.sender] = manufacturer; // Pass instance to mapping 
        ManufacturersID[manufacturerCount] = manufacturer; // Pass instance to mapping 
        manufacturerCount++; // Increment identifier for subsequent creation
    }
    
    function addSupply(uint supply) public {
        Manufacturer storage manufacturer = ManufacturersID[Manufacturers[msg.sender].id];
        manufacturer.capacity = manufacturer.capacity + supply;
    }

}