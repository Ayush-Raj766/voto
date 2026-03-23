import { Election } from "../models/election.model.js"
import { User } from "../models/user.model.js"
import { contract } from "../utils/blockchain.js"



/* ================= GET ALL ELECTIONS ================= */

export const getElections = async (req, res, next) => {
  try {

    const elections = await Election
      .find()
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: elections
    })

  } catch (error) {
    next(error)
  }
}



/* ================= GET ACTIVE ELECTIONS ================= */

export const getActiveElections = async (req, res, next) => {
  try {

    const elections = await Election
      .find({ status: "active" })
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data: elections
    })

  } catch (error) {
    next(error)
  }
}



/* ================= GET SINGLE ELECTION ================= */

export const getElection = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    return res.status(200).json({
      success: true,
      data: election
    })

  } catch (error) {
    next(error)
  }

}



/* ================= CREATE ELECTION ================= */

export const createElection = async (req, res, next) => {

  try {

    const { title, description, startDate, endDate } = req.body

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Title, start date and end date required"
      })
    }

    const start = Math.floor(new Date(startDate).getTime() / 1000)
    const end = Math.floor(new Date(endDate).getTime() / 1000)

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date"
      })
    }

    /* ---- blockchainId from contract ---- */
    const electionCount = await contract.electionCount()

    const election = await Election.create({
      title,
      description,
      startDate,
      endDate,
      blockchainId: Number(electionCount),
      status: "upcoming",
      candidates: [],
      voters: [],
      totalVotes: 0,
      txHash: req.body.txHash
    })

    return res.status(201).json({
      success: true,
      data: election
    })

  } catch (error) {

    console.error("CREATE ELECTION ERROR:", error)

    next(error)

  }

}



/* ================= ADD CANDIDATE ================= */

export const addCandidate = async (req, res, next) => {

  try {

    const { name, party, imageUrl, walletAddress } = req.body

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    const wallet = walletAddress?.toLowerCase()

    /* candidate id comes from blockchain order */
    const candidateId = election.candidates.length + 1

    election.candidates.push({
      id: candidateId,
      name,
      party,
      imageUrl,
      walletAddress: wallet,
      votes: 0
    })

    if (req.body.txHash) {
      // Optional: Log txHash or update last action
    }

    await election.save()

    return res.status(201).json({
      success: true,
      data: election.candidates[election.candidates.length - 1]
    })

  } catch (error) {
    next(error)
  }

}



/* ================= RECORD VOTE ================= */

export const vote = async (req, res, next) => {

  try {

    const { candidateId, walletAddress, txHash } = req.body

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    if (election.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Election is not active"
      })
    }

    const wallet = walletAddress?.toLowerCase()

    const voter = await User.findOne({ walletAddress: wallet })

    if (!voter || voter.isApproved !== true) {
      return res.status(403).json({
        success: false,
        message: "Voter not verified"
      })
    }

    if (election.voters.includes(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Already voted"
      })
    }

    /* Blockchain already counted the vote */

    election.voters.push(wallet)

    await election.save()

    return res.status(200).json({
      success: true,
      txHash,
      message: "Vote recorded"
    })

  } catch (error) {
    next(error)
  }

}



/* ================= START ELECTION ================= */

export const startElection = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    election.status = "active"

    if (req.body.txHash) {
      // Optional: Log txHash
    }

    await election.save()

    return res.status(200).json({
      success: true,
      message: "Election started"
    })

  } catch (error) {
    next(error)
  }

}



/* ================= END ELECTION ================= */

export const endElection = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    if (!election) {
      return res.status(404).json({
        success: false,
        message: "Election not found"
      })
    }

    election.status = "ended"

    if (req.body.txHash) {
      // Optional: Log txHash
    }

    await election.save()

    return res.status(200).json({
      success: true,
      message: "Election ended"
    })

  } catch (error) {
    next(error)
  }

}



/* ================= GET WINNER ================= */

export const getWinner = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    const result = await contract.getWinner(
      election.blockchainId
    )

    const winnerId = Number(result[0])
    const votes = Number(result[1])

    const candidate = election.candidates.find(
      c => Number(c.id) === winnerId
    )

    return res.status(200).json({
      success: true,
      winnerId,
      votes,
      candidate
    })

  } catch (error) {
    next(error)
  }

}



/* ================= HAS VOTED ================= */

export const hasVoted = async (req, res, next) => {

  try {

    const election = await Election.findById(req.params.id)

    const wallet = req.params.wallet?.toLowerCase()

    const voted = wallet
      ? election.voters.includes(wallet)
      : false

    return res.status(200).json({
      success: true,
      voted
    })

  } catch (error) {
    next(error)
  }

}