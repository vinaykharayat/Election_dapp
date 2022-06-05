App = {
  web3Provider: null,
  contracts: {},
  account:"0X0",
  electionContractAddress: "0x414C7A406b41F994D733764ae48f2aa36F10ab05",
  electionContractABI: null,
  signer: null,

  init: async function() {
    return App.initWeb3();
  },

  connectMetamask: async function() {
    App.web3Provider = new ethers.providers.Web3Provider(window.ethereum)
    await App.web3Provider.send("eth_requestAccounts", []);
    App.signer = await App.web3Provider.getSigner();
    console.log("Account address :", await App.signer.getAddress());
    App.account = await App.signer.getAddress();
    $("#accountAddress").html("Your Account: " + App.account);
    App.init();
    return App.signer;
  },

  //Initialize connection from client(frontend) to blockchain
  initWeb3: async function() {
    App.signer = await App.web3Provider.getSigner();
    if(App.web3Provider !== 'null'){
      
      //If a web3 instance is already provided by Metamask.
      $("#connect").prop("disabled", true);
      App.web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      App.signer = await App.web3Provider.getSigner();
      App.account = App.signer.getAddress();
      web3 = new Web3(App.web3Provider);
      return App.initContract();

    }else{
      $("#connect").prop("disabled", false);
      // App.web3Provider = new ethers.providers.Web3Provider(window.ethereum)
      // web3 = new Web3(App.web3Provider);
      alert("Please connect to Metamask");
      return;

    }

  },

  //Loads contracts to frontend application
  initContract:async function() {

    $.getJSON("src/js/Election.json", (election)=>{
      App.electionContractABI = election;
      App.contracts.Election = new ethers.Contract(
        App.electionContractAddress,
        App.electionContractABI,
        App.web3Provider
      );
      console.log(App.electionContractABI);

      App.listenForEvents();
      return App.render();

    });
  },

  listenForEvents: ()=>{
    App.contracts.Election.deployed().then((instance)=>{
      console.log(instance); 
      instance.votedEvent({}, {
        //Check for event from 0 block to latests
        fromBlock: 0,
        toBlock:"latest"
      }).watch((err, event)=>{
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: async ()=>{
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    //Load contract data
    App.contracts.Election.deployed().then((instance)=>{
      electionInstance = instance;
      console.log("electionInstance", electionInstance);
    });
    App.contracts.Election.deployed().then((instance)=>{
      electionInstance = instance;
      console.log("candidatesCount",electionInstance.candidatesCount());
      return electionInstance.candidatesCount();
    }).then((candidatesCount)=>{
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $("#candidatesSelect");
      candidatesSelect.empty();

      for(var i = 1; i<= candidatesCount; i++){
        console.log("candidates",electionInstance.candidates(i));
        electionInstance.candidates(i).then((candidate)=>{
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          //Render Candidate Result

          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          candidatesResults.append(candidateTemplate);
           var candidateOption = "<option value='"+ id +"'>" + name + "</option>";
           candidatesSelect.append(candidateOption);
        });
      }
      console.log("account",App.account);

      console.log("voters",electionInstance.voters(App.account));
      return electionInstance.voters(App.account);
    }).then((hasVoted)=>{
      if(hasVoted){
        // $("form").hide();
      }
      loader.hide();
      content.show();
    }).catch((error)=>{
      console.warn(error);
    });
  },

  castVote: ()=>{
    // $("#content").hide();
    // $("#loader").show();
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then((instance)=>{
      console.log(App.signer);
      return instance.connect(App.signer).vote(candidateId, {from: App.account});
    }).then((result)=>{
      location.reload(); 
      $("#content").hide();
      $("#loader").show();
    }).catch((err)=>{
      console.error(err);
    });
  },
  
};

$(function() {
  $(window).load(async function() {
    await App.init();
  });
});
