import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getVoters,
    approveVoter,
    getSubadmins,
    createSubadmin,
    toggleSubadminActive,
    deleteSubadmin,
    getVoterHistory,
    getCurrentUser,
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/* ─── Public routes ──────────────────────────────── */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ─── Auth-required routes ────────────────────────── */
router.post("/logout", verifyJWT, logoutUser);

// Voter management (admin / subadmin)
router.get("/voters", verifyJWT, getVoters);
router.post("/:id/approve", verifyJWT, approveVoter);

// Subadmin management (admin only)
router.get("/subadmins", verifyJWT, getSubadmins);
router.post("/subadmins", verifyJWT, createSubadmin);
router.patch("/:id/toggle", verifyJWT, toggleSubadminActive);
router.delete("/:id", verifyJWT, deleteSubadmin);

// Voter history (voter)
router.get("/me", verifyJWT, getCurrentUser);
router.get("/me/history", verifyJWT, getVoterHistory);

export default router;