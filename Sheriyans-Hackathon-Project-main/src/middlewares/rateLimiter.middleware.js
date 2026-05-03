const rateLimitMap = new Map();

const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap) {
        if (now - value.start > value.windowMs) {
            rateLimitMap.delete(key);
        }
    }
};

setInterval(cleanup, 60000);

export const rateLimiter = (options = {}) => {
    const { windowMs = 60000, max = 100, message = 'Too many requests' } = options;

    return (req, res, next) => {
        const key = req.ip || req.connection?.remoteAddress;
        const now = Date.now();

        if (!rateLimitMap.has(key)) {
            rateLimitMap.set(key, { count: 1, start: now, windowMs });
        } else {
            const record = rateLimitMap.get(key);
            if (now - record.start > record.windowMs) {
                rateLimitMap.set(key, { count: 1, start: now, windowMs });
            } else {
                record.count++;
                if (record.count > max) {
                    return res.status(429).json({ error: message });
                }
            }
        }

        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', Math.max(0, max - rateLimitMap.get(key).count));
        next();
    };
};

export const aiRateLimiter = rateLimiter({ windowMs: 60000, max: 20, message: 'AI rate limit exceeded. Try again later.' });

export default { rateLimiter, aiRateLimiter };
