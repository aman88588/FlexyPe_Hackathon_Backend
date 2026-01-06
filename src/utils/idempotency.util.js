// request deduplication
/**
 * Extract idempotency key from request
 * Priority: Header > Body
 */
const getIdempotencyKey = (req) => {
    return (
        req.headers["idempotency-key"] ||
        req.headers["x-idempotency-key"] ||
        req.body.idempotencyKey ||
        null
    );
};

module.exports = {
    getIdempotencyKey,
};
