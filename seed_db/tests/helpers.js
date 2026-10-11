// Several routes/scripts fire off work without every caller awaiting it
// (see index.js's own fire-and-forget setupDB()) so a single `setImmediate`
// tick isn't long enough to wait for the real, I/O-bound side effect to
// land. Polling `predicate` until it's true (or timing out) waits for the
// actual result instead of guessing how many ticks it needs.
const waitFor = async (predicate, { timeout = 2000, interval = 20 } = {}) => {
  const start = Date.now();
  while (!(await predicate())) {
    if (Date.now() - start > timeout) {
      throw new Error('waitFor: timed out waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
};

module.exports = { waitFor };
