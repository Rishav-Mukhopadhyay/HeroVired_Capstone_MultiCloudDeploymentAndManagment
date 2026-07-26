const { asyncForEach } = require('./utils');

it('awaits the callback for each element, in order', async () => {
  const seen = [];

  await asyncForEach([10, 20, 30], async (item, index, arr) => {
    await Promise.resolve();
    seen.push([item, index, arr.length]);
  });

  expect(seen).toEqual([
    [10, 0, 3],
    [20, 1, 3],
    [30, 2, 3]
  ]);
});
