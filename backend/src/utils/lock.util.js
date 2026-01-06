/**
 * Simple in-memory lock manager
 * Used to serialize critical sections (like inventory reservation)
 */

const locks = new Map();

/**
 * Acquire a lock for a given key (e.g., SKU)
 */
const acquireLock = async (key) => {
  while (locks.get(key)) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  locks.set(key, true);
};

/**
 * Release the lock
 */
const releaseLock = (key) => {
  locks.delete(key);
};

/**
 * Clear all locks (used during graceful shutdown)
 */
const clearAllLocks = () => {
  locks.clear();
};

module.exports = {
  acquireLock,
  releaseLock,
  clearAllLocks,
};
