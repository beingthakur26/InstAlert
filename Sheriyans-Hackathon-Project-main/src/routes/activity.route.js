import express from 'express';
import { getActivities } from '../controllers/activity.controller.js';
import validateUser from '../middlewares/validateUser.middleware.js';

const router = express.Router();

router.get('/', validateUser, getActivities);

export default router;