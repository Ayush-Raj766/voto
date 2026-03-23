// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockVote {

    address public admin;

    constructor() {
        admin = msg.sender;
    }

    /* ------------------------------------------------ */
    /*                     MODIFIERS                    */
    /* ------------------------------------------------ */

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlySubAdmin() {
        require(subAdmins[msg.sender].isActive, "Only subadmin allowed");
        _;
    }

    modifier onlyAdminOrSubAdmin() {
        require(
            msg.sender == admin || subAdmins[msg.sender].isActive,
            "Not authorized"
        );
        _;
    }

    modifier electionExists(uint _electionId) {
        require(_electionId > 0 && _electionId <= electionCount, "Election not found");
        _;
    }

    /* ------------------------------------------------ */
    /*                    STRUCTS                       */
    /* ------------------------------------------------ */

    struct SubAdmin {
        address wallet;
        string fullName;
        string email;
        bool isActive;
    }

    struct Voter {
        address wallet;
        string fullName;
        bool registered;
        bool verified;
    }

    struct Candidate {
        uint id;
        string name;
        string party;
        string imageUrl;
        address walletAddress;
        uint votes;
    }

    struct Election {
        uint id;
        string title;
        string description;
        uint startDate;
        uint endDate;
        bool active;
        uint totalVotes;
        uint candidateCount;

        mapping(uint => Candidate) candidates;
        mapping(address => bool) voters;
    }

    /* ------------------------------------------------ */
    /*                    STORAGE                       */
    /* ------------------------------------------------ */

    uint public electionCount;

    mapping(uint => Election) private elections;

    mapping(address => SubAdmin) public subAdmins;

    mapping(address => Voter) public voters;

    /* ------------------------------------------------ */
    /*                     EVENTS                       */
    /* ------------------------------------------------ */

    event SubAdminAdded(address wallet, string name);
    event SubAdminRemoved(address wallet);

    event VoterRegistered(address voter);
    event VoterVerified(address voter);

    event ElectionCreated(uint electionId, string title);
    event CandidateAdded(uint electionId, uint candidateId);
    event VoteCast(uint electionId, uint candidateId, address voter);

    /* ------------------------------------------------ */
    /*                 SUB ADMIN CONTROL                */
    /* ------------------------------------------------ */

    function addSubAdmin(
        address _wallet,
        string memory _name,
        string memory _email
    ) public onlyAdmin {

        subAdmins[_wallet] = SubAdmin({
            wallet: _wallet,
            fullName: _name,
            email: _email,
            isActive: true
        });

        emit SubAdminAdded(_wallet, _name);
    }

    function removeSubAdmin(address _wallet) public onlyAdmin {
        subAdmins[_wallet].isActive = false;
        emit SubAdminRemoved(_wallet);
    }

    /* ------------------------------------------------ */
    /*                 VOTER REGISTRATION               */
    /* ------------------------------------------------ */

    function registerVoter(string memory _name) public {

        require(!voters[msg.sender].registered, "Already registered");

        voters[msg.sender] = Voter({
            wallet: msg.sender,
            fullName: _name,
            registered: true,
            verified: false
        });

        emit VoterRegistered(msg.sender);
    }

    function verifyVoter(address _voter)
        public
        onlyAdminOrSubAdmin
    {
        require(voters[_voter].registered, "Not registered");
        require(!voters[_voter].verified, "Already verified");

        voters[_voter].verified = true;

        emit VoterVerified(_voter);
    }

    /* ------------------------------------------------ */
    /*                 CREATE ELECTION                  */
    /* ------------------------------------------------ */

    function createElection(
        string memory _title,
        string memory _description,
        uint _startDate,
        uint _endDate
    ) public onlyAdmin {

        require(_endDate > _startDate, "Invalid dates");

        electionCount++;

        Election storage e = elections[electionCount];

        e.id = electionCount;
        e.title = _title;
        e.description = _description;
        e.startDate = _startDate;
        e.endDate = _endDate;
        e.active = false;

        emit ElectionCreated(electionCount, _title);
    }

    /* ------------------------------------------------ */
    /*                ADD CANDIDATE                     */
    /* ------------------------------------------------ */

    function addCandidate(
        uint _electionId,
        string memory _name,
        string memory _party,
        string memory _imageUrl,
        address _wallet
    )
        public
        electionExists(_electionId)
        onlyAdminOrSubAdmin
    {
        Election storage e = elections[_electionId];

        e.candidateCount++;

        e.candidates[e.candidateCount] = Candidate({
            id: e.candidateCount,
            name: _name,
            party: _party,
            imageUrl: _imageUrl,
            walletAddress: _wallet,
            votes: 0
        });

        emit CandidateAdded(_electionId, e.candidateCount);
    }

    /* ------------------------------------------------ */
    /*             START / END ELECTION                 */
    /* ------------------------------------------------ */

    function startElection(uint _electionId)
        public
        onlyAdmin
        electionExists(_electionId)
    {
        elections[_electionId].active = true;
    }

    function endElection(uint _electionId)
        public
        onlyAdmin
        electionExists(_electionId)
    {
        elections[_electionId].active = false;
    }

    /* ------------------------------------------------ */
    /*                     VOTE                         */
    /* ------------------------------------------------ */

    function vote(uint _electionId, uint _candidateId)
        public
        electionExists(_electionId)
    {
        Election storage e = elections[_electionId];

        require(voters[msg.sender].verified, "Not verified voter");
        require(e.active, "Election not active");
        require(!e.voters[msg.sender], "Already voted");
        require(_candidateId > 0 && _candidateId <= e.candidateCount, "Invalid candidate");

        e.voters[msg.sender] = true;

        e.candidates[_candidateId].votes++;

        e.totalVotes++;

        emit VoteCast(_electionId, _candidateId, msg.sender);
    }

    /* ------------------------------------------------ */
    /*                GET ELECTION INFO                 */
    /* ------------------------------------------------ */

    function getElection(uint _electionId)
        public
        view
        electionExists(_electionId)
        returns (
            uint id,
            string memory title,
            string memory description,
            uint startDate,
            uint endDate,
            bool active,
            uint totalVotes,
            uint candidateCount
        )
    {
        Election storage e = elections[_electionId];

        return (
            e.id,
            e.title,
            e.description,
            e.startDate,
            e.endDate,
            e.active,
            e.totalVotes,
            e.candidateCount
        );
    }

    /* ------------------------------------------------ */
    /*               GET CANDIDATE INFO                 */
    /* ------------------------------------------------ */

    function getCandidate(uint _electionId, uint _candidateId)
        public
        view
        electionExists(_electionId)
        returns (
            uint id,
            string memory name,
            string memory party,
            string memory imageUrl,
            address wallet,
            uint votes
        )
    {
        Candidate storage c = elections[_electionId].candidates[_candidateId];

        return (
            c.id,
            c.name,
            c.party,
            c.imageUrl,
            c.walletAddress,
            c.votes
        );
    }

    /* ------------------------------------------------ */
    /*                   HAS VOTED                      */
    /* ------------------------------------------------ */

    function hasVoted(uint _electionId, address _voter)
        public
        view
        returns(bool)
    {
        return elections[_electionId].voters[_voter];
    }

    /* ------------------------------------------------ */
    /*                 GET WINNER                       */
    /* ------------------------------------------------ */

    function getWinner(uint _electionId)
        public
        view
        electionExists(_electionId)
        returns(uint winnerId, uint votes)
    {
        Election storage e = elections[_electionId];

        uint highestVotes = 0;
        uint winningCandidate = 0;

        for(uint i = 1; i <= e.candidateCount; i++) {

            if(e.candidates[i].votes > highestVotes) {
                highestVotes = e.candidates[i].votes;
                winningCandidate = i;
            }
        }

        return (winningCandidate, highestVotes);
    }
}