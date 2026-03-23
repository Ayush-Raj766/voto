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

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();



/* -------- Elections -------- */

router.get("/", verifyJWT, getElections);
router.get("/voter", verifyJWT, getActiveElections);   
router.get("/:id", verifyJWT, getElection);



/* -------- Create -------- */

router.post("/", verifyJWT, createElection);



/* -------- Candidates -------- */

router.post("/:id/candidates", verifyJWT, addCandidate);



/* -------- Voting -------- */

router.post("/:id/vote", verifyJWT, vote);
router.get("/:id/has-voted/:wallet", verifyJWT, hasVoted);



/* -------- Election Control -------- */

router.post("/:id/start", verifyJWT, startElection);
router.post("/:id/end", verifyJWT, endElection);



/* -------- Result -------- */

router.get("/:id/winner", verifyJWT, getWinner);



export default router;