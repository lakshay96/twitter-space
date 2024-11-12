// pages/api/search.js
import { scrapeTweets } from '../../lib/scraper';
import { insertJobToQueue, updateJobStatus } from '../../lib/jobQueue';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;

    // Step 1: Insert job into queue and get jobId
    const jobId = await insertJobToQueue(query);

    // Step 2: Scrape tweets based on the query
    try {
      const tweets = await scrapeTweets(query);

      // Step 3: Update the job status to 'completed'
      await updateJobStatus(jobId, 'completed', tweets);

      // Send success response with job details
      res.status(200).json({ jobId, status: 'completed', tweets });
    } catch (error) {
      // If an error occurs during scraping, update the status to 'failed'
      await updateJobStatus(jobId, 'failed');
      res.status(500).json({ error: 'Failed to scrape tweets', details: error.message });
    }

  } else {
    // If method is not POST, return method not allowed
    res.status(405).json({ error: 'Method not allowed' });
  }
}
