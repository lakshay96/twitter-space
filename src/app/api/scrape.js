import { scrapeTweets } from '../../lib/scraper';
import { insertJobToQueue, updateJobStatus } from '../../lib/jobQueue';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;

    // Insert the job into the queue (simulating with a simple array or DB)
    const jobId = await insertJobToQueue(query);

    // Start scraping in a worker (simulated here with an async function)
    const tweets = await scrapeTweets(query);

    // Update job status to completed
    await updateJobStatus(jobId, 'completed', tweets);

    // Send the response
    res.status(200).json({ jobId, status: 'completed', tweets });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
