import express from "express";
import adminController from "../controllers/admin.controller.js";
import validateUser from "../middlewares/validateUser.middleware.js";
import validateAccessMiddleware from "../middlewares/validateAccess.middleware.js";

const router = express.Router();

/*
    @route GET /admin/dashboard
    @desc Welcome to the admin dashboard
    @access Private
    @roles admin
*/
router.get("/dashboard",validateUser,validateAccessMiddleware.validateAdmin, (req, res) => {
    res.json({ message: "Welcome to the admin dashboard!" });
});

/*
    @route POST /admin/create-organization
    @desc Create a new organization (admin only)
    @access Private
    @roles admin
*/
router.post("/create-organization",validateUser,validateAccessMiddleware.validateAdmin, adminController.createOrganization)

export default router;