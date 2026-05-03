import express from 'express';
import validateUser from '../middlewares/validateUser.middleware.js';
import notificationService from '../services/notification.service.js';
import { validate } from '../middlewares/validateRequest.middleware.js';
import { notificationChannelSchema } from '../middlewares/validateRequest.middleware.js';

const router = express.Router();

/*
    @route GET /notifications/channels
    @desc Get all notification channels
    @access Private
*/
router.get('/channels', validateUser, notificationService.getChannels);

/*
    @route POST /notifications/channels
    @desc Create a notification channel
    @access Private
*/
router.post('/channels', validateUser, validate(notificationChannelSchema), notificationService.createChannel);

/*
    @route PUT /notifications/channels/:id
    @desc Update a notification channel
    @access Private
*/
router.put('/channels/:id', validateUser, notificationService.updateChannel);

/*
    @route DELETE /notifications/channels/:id
    @desc Delete a notification channel
    @access Private
*/
router.delete('/channels/:id', validateUser, notificationService.deleteChannel);

/*
    @route POST /notifications/channels/:id/test
    @desc Test a notification channel
    @access Private
*/
router.post('/channels/:id/test', validateUser, notificationService.testChannel);

export default router;
