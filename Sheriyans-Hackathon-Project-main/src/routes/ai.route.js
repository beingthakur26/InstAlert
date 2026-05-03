import express from 'express';
import validateUser from '../middlewares/validateUser.middleware.js';
import aiController from '../controllers/ai.controller.js';
import { aiRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = express.Router();

/*
    @route POST /ai/chat
    @desc Chat with AI assistant
    @access Private
*/
router.post('/chat', validateUser, aiRateLimiter, aiController.aiChat);

/*
    @route POST /ai/:id/summarize
    @desc Generate AI summary for an incident
    @access Private
*/
router.post('/:id/summarize', validateUser, aiRateLimiter, aiController.aiSummarizeIncident);

/*
    @route POST /ai/:id/root-cause
    @desc AI root cause analysis
    @access Private
*/
router.post('/:id/root-cause', validateUser, aiRateLimiter, aiController.aiRootCause);

/*
    @route POST /ai/:id/predict-severity
    @desc AI severity prediction
    @access Private
*/
router.post('/:id/predict-severity', validateUser, aiRateLimiter, aiController.aiPredictSeverity);

/*
    @route POST /ai/:id/recommend-assignees
    @desc AI assignee recommendation
    @access Private
*/
router.post('/:id/recommend-assignees', validateUser, aiRateLimiter, aiController.aiRecommendAssignees);

/*
    @route POST /ai/:id/compress-timeline
    @desc AI timeline compression
    @access Private
*/
router.post('/:id/compress-timeline', validateUser, aiRateLimiter, aiController.aiCompressTimeline);

/*
    @route POST /ai/:id/find-similar
    @desc Find similar incidents
    @access Private
*/
router.post('/:id/find-similar', validateUser, aiRateLimiter, aiController.aiFindSimilar);

export default router;
