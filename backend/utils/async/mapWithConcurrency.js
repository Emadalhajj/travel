export const mapWithConcurrency = async (items, concurrency, worker) => {
  const values = Array.from(items || []);
  if (!values.length) return [];

  const workerCount = Math.min(
    values.length,
    Math.max(1, Math.floor(Number(concurrency) || 1)),
  );
  const results = new Array(values.length);
  let nextIndex = 0;

  const runWorker = async () => {
    while (nextIndex < values.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(values[index], index);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, runWorker));
  return results;
};
