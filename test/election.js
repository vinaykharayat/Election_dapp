var Election = artifacts.require("./Election.sol");

//Initialize contract

contract("Election", (accounts)=>{
	var electionInstance;
	
	//Check if total number of candidates are correct
	it("initializes with two candidates", function(){
		return Election.deployed().then((instance)=>{
			return instance.candidatesCount();
		}).then((count)=>{
			assert.equal(count,2);
		});
	});

	//Check if the value of candidates are correct
	it("it initializes the candidates with correct values", ()=>{
		return Election.deployed().then((instance)=>{
			electionInstance = instance;
			return electionInstance.candidates(1);
		}).then((candidate)=>{
			assert.equal(candidate[0], 1, "Contains correct ID");
			assert.equal(candidate[1], "Vinay", "Contains correct Name");
			assert.equal(candidate[2], 0, "Contains correct votes");
			return electionInstance.candidates(2);
		}).then((candidate)=>{
			assert.equal(candidate[0], 2, "Contains correct ID");
			assert.equal(candidate[1], "Binnu", "Contains correct Name");
			assert.equal(candidate[2], 0, "Contains correct votes");
		});
	});

	it("allows a voter to cast a vote", ()=>{
		return Election.deployed().then((instance)=>{
			electionInstance = instance;
			candidateId = 1;
			return electionInstance.vote(candidateId, {from: accounts[0]});
		}).then((receipt)=>{
			assert.equal(receipt.logs.length, 1, "an event was triggered");
			assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
			assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate ID is correct");

			return electionInstance.voters(accounts[0]);
		}).then((voted)=>{
			assert(voted, "the voter was marked as voted");
			return electionInstance.candidates(candidateId);
		}).then((candidate)=>{
			var voteCount = candidate[2];
			assert.equal(voteCount, 1, "increments the candidate vote count");
		});
	});

	it("throws an exception for invalid candidates", ()=>{
		return Election.deployed().then((instance)=>{
			electionInstance = instance;
			return electionInstance.vote(99, {from: accounts[0]});
		}).then(assert.fail).catch((err)=>{
			assert(err.message.indexOf("revert") >= 0, "error message must contain revert");
			return electionInstance.candidates(1);
		}).then((candidate1)=>{
			var voteCount = candidate1[2];
			assert.equal(voteCount, 1, "Vinay did not receive the vote");
			return electionInstance.candidates(2);
		}).then((candidate2)=>{
			var voteCount = candidate2[2];
			assert.equal(voteCount, 0, "Binnu did not receive the vote");
		});
	});

	it("throws an exception for double voting", ()=>{
		return Election.deployed().then((instance)=>{
			electionInstance = instance;
			candidateId = 2;
			//cast first vote
			return electionInstance.vote(candidateId, {from: accounts[1]}).then(()=>{
				return electionInstance.candidates(candidateId);
			});
		}).then((candidate)=>{
			var voteCount = candidate[2];
			assert.equal(voteCount, 1, "accepts first vote");
			//try to vote again
			return electionInstance.vote(candidateId, {from:accounts[1]});
		}).then(assert.fail).catch((err)=>{
			assert(err.message.indexOf("revert") >= 0, err.toString());
			return electionInstance.candidates(1);
		}).then((candidate1)=>{
			var voteCount = candidate1[2];
			assert.equal(voteCount, 1, "candidate 1 did not receive vote");
			return electionInstance.candidates(2);
		}).then((candidate2)=>{
			var voteCount = candidate2[2];
			assert.equal(voteCount, 1, "candidate2 did not receive any vote");
		});
	});
});