import NotificationChannelModel from '../models/notificationChannel.model.js';
import OrganizationModel from '../models/organization.model.js';
import Referer from '../models/referer.model.js';
import nodemailer from 'nodemailer';

const checkOrgAccess = async (userId, organizationId) => {
    const org = await OrganizationModel.findById(organizationId);
    if (!org) return false;
    const isOwner = org.owner.toString() === userId.toString();
    const isMember = await Referer.exists({ referer: userId, organization: organizationId });
    const isAdmin = (await import('../models/user.model.js')).default.findById(userId).then(u => u?.role === 'admin');
    return isOwner || isMember || isAdmin;
};

const sendWebhook = async (url, payload) => {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            timeout: 10000,
        });
        return response.ok;
    } catch (err) {
        console.error('[Notification] Webhook failed:', err.message);
        return false;
    }
};

const sendSlack = async (url, channel, text) => {
    const payload = {
        channel: channel || '#incidents',
        text,
        mrkdwn: true,
    };
    return sendWebhook(url, payload);
};

const sendEmail = async (email, subject, body, eventType) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const severityColors = {
            'incident.created': '#ef4444',
            'incident.updated': '#f59e0b',
            'incident.resolved': '#22c55e',
            'sla.breach': '#dc2626',
            'test': '#6366f1',
        };

        const severityIcons = {
            'incident.created': '🚨',
            'incident.updated': '📝',
            'incident.resolved': '✅',
            'sla.breach': '⚠️',
            'test': '🔔',
        };

        const color = severityColors[eventType] || '#37322F';
        const icon = severityIcons[eventType] || '📋';
        const title = subject.replace('[InstaAlert] ', '');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
                            <tr>
                                <td style="background:#37322F;padding:32px 40px;text-align:center;">
                                    <div style="font-size:32px;margin-bottom:8px;">${icon}</div>
                                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">InstaAlert</h1>
                                    <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:14px;">Smart Incident Response</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:40px;">
                                    <div style="background:${color};width:4px;height:40px;border-radius:2px;margin-bottom:24px;"></div>
                                    <h2 style="color:#37322F;margin:0 0 8px;font-size:20px;font-weight:600;">${title}</h2>
                                    <div style="color:#605A57;font-size:14px;line-height:1.7;white-space:pre-wrap;margin-top:20px;">${body}</div>
                                    <table role="presentation" style="margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;width:100%;">
                                        <tr>
                                            <td style="color:#999;font-size:12px;">
                                                This is an automated notification from InstaAlert.<br>
                                                <a href="${process.env.CLIENT_URL || 'https://instalert-atbh.onrender.com'}" style="color:#37322F;text-decoration:underline;">View Dashboard</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>`;

        await transporter.sendMail({
            from: `"InstaAlert" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: email,
            subject,
            text: body,
            html,
        });
        return true;
    } catch (err) {
        console.error('[Notification] Email send failed:', err.message);
        return false;
    }
};

export const createChannel = async (req, res) => {
    try {
        const { organizationId, type, config, events } = req.body;

        if (!organizationId || !type) return res.status(400).json({ error: 'Organization ID and type are required' });

        const hasAccess = await checkOrgAccess(req.user._id, organizationId);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const channel = await NotificationChannelModel.create({
            organization: organizationId,
            type,
            config,
            events: events || ['incident.created', 'incident.updated', 'incident.resolved', 'sla.breach'],
        });

        res.status(201).json({ message: 'Notification channel created', channel });
    } catch (err) {
        console.error('[Notification] Create channel error:', err);
        res.status(500).json({ error: 'Failed to create notification channel' });
    }
};

export const getChannels = async (req, res) => {
    try {
        const orgIds = await Promise.all([
            Referer.find({ referer: req.user._id }).select('organization'),
            OrganizationModel.find({ owner: req.user._id }).select('_id'),
        ]).then(([refs, owned]) => [...refs.map(r => r.organization), ...owned.map(o => o._id)]);

        const channels = await NotificationChannelModel.find({ organization: { $in: orgIds } }).sort({ createdAt: -1 });

        res.json({ channels });
    } catch (err) {
        console.error('[Notification] Fetch channels error:', err);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
};

export const updateChannel = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, config, events, active } = req.body;

        const channel = await NotificationChannelModel.findById(id);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const hasAccess = await checkOrgAccess(req.user._id, channel.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        if (type !== undefined) channel.type = type;
        if (config !== undefined) channel.config = { ...channel.config, ...config };
        if (events !== undefined) channel.events = events;
        if (active !== undefined) channel.active = active;

        await channel.save();

        res.json({ message: 'Channel updated', channel });
    } catch (err) {
        console.error('[Notification] Update channel error:', err);
        res.status(500).json({ error: 'Failed to update channel' });
    }
};

export const deleteChannel = async (req, res) => {
    try {
        const { id } = req.params;

        const channel = await NotificationChannelModel.findById(id);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const hasAccess = await checkOrgAccess(req.user._id, channel.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        await NotificationChannelModel.findByIdAndDelete(id);

        res.json({ message: 'Channel deleted' });
    } catch (err) {
        console.error('[Notification] Delete channel error:', err);
        res.status(500).json({ error: 'Failed to delete channel' });
    }
};

export const testChannel = async (req, res) => {
    try {
        const { id } = req.params;

        const channel = await NotificationChannelModel.findById(id);
        if (!channel) return res.status(404).json({ error: 'Channel not found' });

        const hasAccess = await checkOrgAccess(req.user._id, channel.organization);
        if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

        const success = await notify(channel, 'test', { message: 'This is a test notification from InstaAlert.' });

        res.json({ message: success ? 'Test notification sent successfully' : 'Test notification failed', success });
    } catch (err) {
        console.error('[Notification] Test channel error:', err);
        res.status(500).json({ error: 'Failed to test channel' });
    }
};

export const notify = async (channel, eventType, data) => {
    if (!channel.active) return false;
    if (channel.events.length > 0 && !channel.events.includes(eventType)) return false;

    const text = buildNotificationText(eventType, data);

    switch (channel.type) {
        case 'slack':
            return sendSlack(channel.config.url, channel.config.channel, text);
        case 'webhook':
            return sendWebhook(channel.config.url, { event: eventType, data, text });
        case 'email':
            return sendEmail(channel.config.email, `[InstaAlert] ${eventType}`, text, eventType);
        default:
            return false;
    }
};

export const notifyAllChannels = async (organizationId, eventType, data) => {
    try {
        const channels = await NotificationChannelModel.find({ organization: organizationId, active: true });
        const results = await Promise.all(channels.map(ch => notify(ch, eventType, data)));
        return results;
    } catch (err) {
        console.error('[Notification] Notify all channels error:', err);
        return [];
    }
};

const buildNotificationText = (eventType, data) => {
    switch (eventType) {
        case 'incident.created':
            return `🚨 *New Incident Created*\n*Title:* ${data.title}\n*Priority:* ${data.priority}\n*Type:* ${data.type}`;
        case 'incident.updated':
            return `📝 *Incident Updated*\n*Title:* ${data.title}\n*Status:* ${data.status}`;
        case 'incident.resolved':
            return `✅ *Incident Resolved*\n*Title:* ${data.title}\n*Resolution:* ${data.resolution || 'N/A'}`;
        case 'sla.breach':
            return `⚠️ *SLA Breach*\n*Incident:* ${data.title}\n*Priority:* ${data.priority}\n*Breached At:* ${new Date().toISOString()}`;
        case 'test':
            return `🔔 *Test Notification*\n${data.message}`;
        default:
            return `[${eventType}] ${JSON.stringify(data)}`;
    }
};

export default {
    createChannel,
    getChannels,
    updateChannel,
    deleteChannel,
    testChannel,
    notify,
    notifyAllChannels,
};
