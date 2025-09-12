import rateLimit from 'express-rate-limit';

export const readingsLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false
});
