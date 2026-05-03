import express from "express";
import userController from "../controllers/user.controller.js";
import validateUser from "../middlewares/validateUser.middleware.js";

const router = express.Router();

/*
    @route POST /user/join-organization
    @desc Join an organization using invite code
    @access Private
*/
router.post("/join-organization", validateUser, userController.joinOrganization);

/*
    @route PUT /user/update-profile
    @desc Update user personal profile
    @access Private
*/
router.put("/update-profile", validateUser, userController.updateProfile);

export default router;