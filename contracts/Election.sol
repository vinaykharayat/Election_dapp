pragma solidity ^0.5.16;

contract Election{

	//Model a candidate
	struct Candidate{
		uint id;
		string name;
		uint voteCount;
	}

	//Store accounts that have voted
	mapping(address => bool) public voters;

	//Store Candidate
	//Fetch Candidate
	mapping(uint => Candidate) public candidates;

	//Store Candidates count
	uint public candidatesCount;

	//voted event
	event votedEvent(
		uint indexed _candidateId
	);

	string public candidate;
	constructor() public {
		addCandidate("Vinay");
		addCandidate("Binnu");
	}

	function addCandidate (string memory _name) private{
		candidatesCount ++;
		candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
	}

	function vote (uint _candidateId) public{
		//Checks if voter have voted or not
		require(!voters[msg.sender]);

		//Checks for valid candidate
		require(_candidateId > 0 && _candidateId <= candidatesCount);

		//Record that voters has voted
		voters[msg.sender] = true;

		// update candidate vote count
		candidates[_candidateId].voteCount ++;

		emit votedEvent(_candidateId);
	}
}