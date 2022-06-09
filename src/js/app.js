App = {
    web3Provider: new ethers.providers.Web3Provider(window.ethereum),
    contracts: {},
    account: "0X0",
    electionContractAddress: "0xeC8e5c95562AE23EbcE61ce43685CD14967071A4",
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
        return App.init();
    },

    //Initialize connection from client(frontend) to blockchain
    initWeb3: async function() {
        // try{
        //   App.web3Provider.getSigner()
        // }catch(err){
        //   console.log("Metamask not connected");
        //   alert("Please connect to Metamask");
        //   return;
        // }
        const accounts = await App.web3Provider.listAccounts();
        if (accounts.length > 0 && App.web3Provider.isMetaMask !== true) {

            //If a web3 instance is already provided by Metamask.
            $("#connect").prop("disabled", true);
            document.getElementById("connect").style.display = "none";
            App.web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            App.signer = App.web3Provider.getSigner();
            App.account = App.signer.getAddress();
            web3 = new Web3(App.web3Provider);
            return App.initContract();

        } else {
            $("#connect").prop("disabled", false);
            document.getElementById("loader").innerText = "Your wallet is not connected to the blockchain. Please connect to Metamask by clicking the button below.";
            // alert("Please connect to Metamask");
            // App.web3Provider = new ethers.providers.Web3Provider(window.ethereum)
            // web3 = new Web3(App.web3Provider);

            return;

        }

    },

    //Loads contracts to frontend application
    initContract: function() {

        $.getJSON("src/js/Election.json", (election) => {
            App.electionContractABI = election;
            App.contracts.Election = new ethers.Contract(
                App.electionContractAddress,
                App.electionContractABI,
                App.web3Provider
            );

            // App.listenForEvents();
            return App.render();

        });
    },

    listenForEvents: () => {
        App.contracts.Election.deployed().then((instance) => {
            console.log(instance);
            instance.votedEvent({}, {
                //Check for event from 0 block to latests
                fromBlock: 0,
                toBlock: "latest"
            }).watch((err, event) => {
                console.log("event triggered", event);
                App.render();
            })
        })
    },

    render: async() => {
        var electionInstance;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        //Load contract data
        App.contracts.Election.deployed().then((instance) => {
            electionInstance = instance;
        });
        App.contracts.Election.deployed().then((instance) => {
            electionInstance = instance;
            return electionInstance.candidatesCount();
        }).then((candidatesCount) => {
            var candidatesResults = $("#candidatesResults");
            candidatesResults.empty();

            var candidatesSelect = $("#candidatesSelect");
            candidatesSelect.empty();

            for (var i = 1; i <= candidatesCount; i++) {
                electionInstance.candidates(i).then((candidate) => {
                    var id = candidate[0];
                    var name = candidate[1];
                    var voteCount = candidate[2];

                    //Render Candidate Result

                    var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
                    candidatesResults.append(candidateTemplate);
                    var candidateOption = "<option value='" + id + "'>" + name + "</option>";
                    candidatesSelect.append(candidateOption);
                });
            }
            console.log("candidatesCount", App.account);
            return electionInstance.voters(App.account);
        }).then((hasVoted) => {
            if (hasVoted) {
                // $("form").hide();
            }
            loader.hide();
            content.show();
        }).catch((error) => {
            console.warn(error);
        });
    },

    castVote: () => {
        // $("#content").hide();
        // $("#loader").show();
        var candidateId = $('#candidatesSelect').val();
        App.contracts.Election.deployed().then((instance) => {
            return instance.connect(App.signer).vote(candidateId, { from: App.account });
        }).then((result) => {
            location.reload();
            $("#content").hide();
            $("#loader").show();
        }).catch((err) => {
            console.error(err);
            alert("You have already voted");
        });
    },

};

$(function() {
    $(window).load(async function() {
        App.init();
    });
});