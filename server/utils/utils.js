// Awaits each async callback in sequence — plain Array.forEach can't do
// this, since it doesn't wait for (or even know about) a callback's promise.
// Currently unused anywhere else in the codebase.
exports.asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
