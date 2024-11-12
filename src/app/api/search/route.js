import { scrapeTweets } from '../../lib/scraper';
import { insertJobToQueue, updateJobStatus } from '../../lib/jobQueue';

export async function POST(req) {
  const { query } = await req.json();

  const jobId = await insertJobToQueue(query);

  try {
    const tweets = await scrapeTweets(query);
    await updateJobStatus(jobId, 'completed', tweets);
    return new Response(JSON.stringify({ jobId, status: 'completed', tweets }), { status: 200 });
  } catch (error) {
    await updateJobStatus(jobId, 'failed');
    return new Response(JSON.stringify({ error: 'Failed to scrape tweets', details: error.message }), { status: 500 });
  }
}

