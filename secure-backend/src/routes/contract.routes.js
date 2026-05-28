import express from "express";
import {
  addCandidate,
  createElection,
  endElection,
  getElection,
  getElections,
  hasVoted,
  getWinner,
  startElection,
  vote,
  getActiveElections
} from "../controllers/contract.controllers.js";

import { verifyJWT, verifyApprovedVoter, verifyApprovedSubadmin } from "../middlewares/auth.middleware.js";

const router = express.Router();



/* -------- Elections -------- */

router.get("/", verifyJWT, verifyApprovedVoter, getElections);
router.get("/voter", verifyJWT, verifyApprovedVoter, getActiveElections);   
router.get("/:id", verifyJWT, verifyApprovedVoter, getElection);



/* -------- Create -------- */

router.post("/", verifyJWT, verifyApprovedSubadmin, createElection);



/* -------- Candidates -------- */

router.post("/:id/candidates", verifyJWT, verifyApprovedSubadmin, addCandidate);



/* -------- Voting -------- */

router.post("/:id/vote", verifyJWT, verifyApprovedVoter, vote);
router.get("/:id/has-voted/:wallet", verifyJWT, verifyApprovedVoter, hasVoted);



/* -------- Election Control -------- */

router.post("/:id/start", verifyJWT, verifyApprovedSubadmin, startElection);
router.post("/:id/end", verifyJWT, verifyApprovedSubadmin, endElection);



/* -------- Result -------- */

router.get("/:id/winner", verifyJWT, verifyApprovedVoter, getWinner);



export default router;