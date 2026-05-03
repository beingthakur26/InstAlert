import express from 'express';
import validateUser from '../middlewares/validateUser.middleware.js';
import statusPageController from '../controllers/statusPage.controller.js';

const router = express.Router();

/*
    @route GET /status-page
    @desc Get status page for user's organization
    @access Private
*/
router.get('/', validateUser, statusPageController.getStatusPage);

/*
    @route POST /status-page
    @desc Create a status page
    @access Private
*/
router.post('/', validateUser, statusPageController.createStatusPage);

/*
    @route PUT /status-page
    @desc Update status page
    @access Private
*/
router.put('/', validateUser, statusPageController.updateStatusPage);

/*
    @route POST /status-page/incident
    @desc Add incident to status page
    @access Private
*/
router.post('/incident', validateUser, statusPageController.addIncidentToStatusPage);

/*
    @route PUT /status-page/:pageId/incident/:incidentIdx
    @desc Update status page incident status
    @access Private
*/
router.put('/:pageId/incident/:incidentIdx', validateUser, statusPageController.updateStatusPageIncident);

/*
    @route GET /status-page/public/:slug
    @desc Get public status page (no auth required)
    @access Public
*/
router.get('/public/:slug', statusPageController.getPublicStatusPage);

export default router;
