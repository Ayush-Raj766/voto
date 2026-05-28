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
    getOrganizations,
    createOrganization,
    searchVoterByWallet,
    approveSubadmin,
} from "../controllers/user.controllers.js";
import { verifyJWT, verifyApprovedSubadmin } from "../middlewares/auth.middleware.js";

const router = Router();

/* ─── Public routes ──────────────────────────────── */
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/organizations", getOrganizations);

/* ─── Auth-required routes ────────────────────────── */
router.post("/logout", verifyJWT, logoutUser);
router.post("/organizations", verifyJWT, createOrganization);

// Voter management (admin / subadmin)
router.get("/voters/search", verifyJWT, verifyApprovedSubadmin, searchVoterByWallet);
router.get("/voters", verifyJWT, verifyApprovedSubadmin, getVoters);
router.post("/:id/approve", verifyJWT, verifyApprovedSubadmin, approveVoter);

// Subadmin management (admin only)
router.get("/subadmins", verifyJWT, getSubadmins);
router.post("/subadmins", verifyJWT, createSubadmin);
router.post("/subadmins/:id/approve", verifyJWT, approveSubadmin);
router.patch("/:id/toggle", verifyJWT, toggleSubadminActive);
router.delete("/:id", verifyJWT, deleteSubadmin);

// Voter history (voter)
router.get("/me", verifyJWT, getCurrentUser);
router.get("/me/history", verifyJWT, getVoterHistory);

export default router;