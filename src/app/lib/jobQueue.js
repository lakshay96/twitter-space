// lib/jobQueue.js
let queue = [];

export async function insertJobToQueue(query) {
  const jobId = queue.length + 1;
  queue.push({ jobId, query, status: 'pending' });
  return jobId;
}

export async function updateJobStatus(jobId, status, tweets = []) {
  const job = queue.find((job) => job.jobId === jobId);
  if (job) {
    job.status = status;
    job.tweets = tweets;
  }
}
