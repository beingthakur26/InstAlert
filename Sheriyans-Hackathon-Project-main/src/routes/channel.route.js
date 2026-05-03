import express from "express";
import validateUser from "../middlewares/validateUser.middleware.js";
import { getChannels, createChannel, getChannelMessages } from "../controllers/channel.controller.js";

const router = express.Router();

router.get("/", validateUser, getChannels);
router.post("/", validateUser, createChannel);
router.get("/:id/messages", validateUser, getChannelMessages);

export default router;