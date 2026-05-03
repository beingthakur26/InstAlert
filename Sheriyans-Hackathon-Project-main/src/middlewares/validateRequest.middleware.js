import { z } from 'zod';

export const incidentSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    organizationId: z.string().min(1, 'Organization ID is required'),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
    type: z.enum(['Alert', 'Bug', 'Downtime', 'Security', 'Maintenance']).optional().default('Alert'),
    location: z.string().max(200).optional(),
    assignees: z.array(z.object({
        userId: z.string(),
        role: z.string().optional().default('Lead')
    })).optional(),
    assigneeId: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

export const updateIncidentSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    status: z.enum(['open', 'in_progress', 'closed', 'monitoring']).optional(),
    resolution: z.string().max(5000).optional(),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
    type: z.enum(['Alert', 'Bug', 'Downtime', 'Security', 'Maintenance']).optional(),
    location: z.string().max(200).optional(),
    assignees: z.array(z.object({
        user: z.string(),
        role: z.string().optional()
    })).optional(),
    tags: z.array(z.string()).optional(),
});

export const postmortemSchema = z.object({
    incidentId: z.string(),
    what_happened: z.string().min(10).max(10000),
    why_it_happened: z.string().min(10).max(10000),
    fix_applied: z.string().min(10).max(10000),
    prevention_steps: z.array(z.string().min(10).max(2000)),
});

export const slaSchema = z.object({
    name: z.string().min(1).max(100),
    severity_levels: z.array(z.object({
        severity: z.enum(['Low', 'Medium', 'High', 'Critical']),
        response_time_minutes: z.number().min(1).max(1440),
        resolution_time_minutes: z.number().min(1).max(10080),
    })),
});

export const notificationChannelSchema = z.object({
    organizationId: z.string().optional(),
    type: z.enum(['slack', 'email', 'webhook']),
    config: z.object({
        url: z.string().optional(),
        email: z.string().optional(),
        channel: z.string().optional(),
    }),
    events: z.array(z.string()).optional(),
});

export const runbookSchema = z.object({
    title: z.string().min(1).max(200),
    trigger_condition: z.string().min(1).max(500),
    steps: z.array(z.object({
        order: z.number().min(1),
        action: z.string().min(1).max(1000),
        type: z.enum(['manual', 'api', 'script']),
    })),
    auto_execute: z.boolean().optional().default(false),
});

export const validate = (schema) => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const issues = error.issues || error.errors || [];
                return res.status(400).json({
                    error: 'Validation failed',
                    details: issues.map(e => ({ field: e.path.join('.'), message: e.message })),
                });
            }
            next(error);
        }
    };
};
