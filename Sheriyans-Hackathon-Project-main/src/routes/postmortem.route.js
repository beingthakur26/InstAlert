import express from 'express';
import validateUser from '../middlewares/validateUser.middleware.js';
import postmortemController from '../controllers/postmortem.controller.js';
import { validate } from '../middlewares/validateRequest.middleware.js';
import { postmortemSchema } from '../middlewares/validateRequest.middleware.js';

const router = express.Router();

/*
    @route GET /postmortems
    @desc Get all postmortems for user's organizations
    @access Private
*/
router.get('/', validateUser, postmortemController.getPostmortems);

/*
    @route GET /postmortems/:id
    @desc Get a single postmortem
    @access Private
*/
router.get('/:id', validateUser, postmortemController.getPostmortem);

/*
    @route POST /postmortems
    @desc Create a manual postmortem
    @access Private
*/
router.post('/', validateUser, validate(postmortemSchema), postmortemController.createPostmortem);

/*
    @route POST /postmortems/generate/:id
    @desc Generate AI postmortem for an incident
    @access Private
*/
router.post('/generate/:id', validateUser, postmortemController.generatePostmortemAI);

/*
    @route POST /postmortems/generate/code/:code
    @desc Generate AI postmortem for an incident by code
    @access Private
*/
router.post('/generate/code/:code', validateUser, postmortemController.generatePostmortemAI);

/*
    @route GET /postmortems/download/:id
    @desc Download a postmortem as a formatted text file
    @access Private
*/
router.get('/download/:id', validateUser, postmortemController.downloadPostmortem);

/*
    @route PUT /postmortems/:id
    @desc Update a postmortem
    @access Private
*/
router.put('/:id', validateUser, postmortemController.updatePostmortem);

export default router;
