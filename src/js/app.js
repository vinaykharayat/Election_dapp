App = {
  web3Provider: null,
  contracts: {},
  account:"0X0",

  init: function() {
    return App.initWeb3();
  },

  //Initialize connection from client(frontend) to blockchain
  initWeb3: function() {
    
    if(typeof web3 !== 'undefined'){
      //If a web3 instance is already provided by Metamask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    }else{
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);

    }

    return App.initContract();
  },

  //Loads contracts to frontend application
  initContract: function() {
    $.getJSON("Election.json", (election)=>{
      App.contracts.Election = TruffleContract(election);

      App.contracts.Election.setProvider(App.web3Provider);
      
      App.listenForEvents();

      return App.render();

    });
  },

  listenForEvents: ()=>{
    App.contracts.Election.deployed().then((instance)=>{
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

  render: ()=>{
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    //Load account data
    web3.eth.getCoinbase((err, account)=>{
      if(err === null){
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    //Load contract data
    App.contracts.Election.deployed().then((instance)=>{
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then((candidatesCount)=>{
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $("#candidatesSelect");
      candidatesSelect.empty();

      for(var i = 1; i<= candidatesCount; i++){
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
      return electionInstance.voters(App.account);
    }).then((hasVoted)=>{
      if(hasVoted){
        $("form").hide();
      }
      loader.hide();
      content.show();
    }).catch((error)=>{
      console.warn(error);
    });
  },

  castVote: ()=>{
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then((instance)=>{
      return instance.vote(candidateId, {from: App.account});
    }).then((result)=>{
      $("#content").hide();
      $("#loader").show();
    }).catch((err)=>{
      console.error(err);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
