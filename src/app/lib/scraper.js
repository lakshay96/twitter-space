import puppeteer from 'puppeteer-extra';
import puppeteerStealth from 'puppeteer-extra-plugin-stealth';
import db from 'database/db';

puppeteer.use(puppeteerStealth());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:30.0) Gecko/20100101 Firefox/30.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
];

async function scrapeTweets(query) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true, // Can set to false for debugging
      slowMo: 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set a random User-Agent for each request
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await page.setUserAgent(randomUserAgent);

    await page.setRequestInterception(true);
    page.on('route', (route, request) => {
      if (request.resourceType() === 'document') {
        route.continue({
          headers: {
            ...request.headers(),
            'User-Agent': randomUserAgent,
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://twitter.com/',
          },
        });
      } else {
        route.continue();
      }
    });

    let navigationAttempts = 0;
    const maxAttempts = 10;  // Increase max attempts
    let navigationSuccess = false;

    while (!navigationSuccess && navigationAttempts < maxAttempts) {
      try {
        await page.goto(`https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query`, {
          waitUntil: 'networkidle0',
          timeout: 60000,  // Increase timeout to 3 minutes
        });
        navigationSuccess = true;  // Success
      } catch (error) {
        navigationAttempts++;
        console.error(`Navigation attempt ${navigationAttempts} failed: ${error.message}`);
        if (navigationAttempts === maxAttempts) throw new Error('Max navigation attempts reached');
      }
    }

    // Wait for tweets to load on the page
    await page.waitForSelector('article', { timeout: 120000 });

    // Scrape tweets after the page has fully loaded
    const tweets = await page.evaluate(() => {
      const tweetNodes = document.querySelectorAll('article');
      const tweetData = [];

      tweetNodes.forEach(node => {
        const tweet = {
          text: node.querySelector('div[lang]')?.textContent || 'No text available',
          user: node.querySelector('div > div > div > div > div > a')?.textContent || 'No user available',
          time: node.querySelector('time')?.getAttribute('datetime') || 'No time available',
        };
        tweetData.push(tweet);
      });

      return tweetData.slice(0, 10);  // Return only the first 10 tweets
    });

    console.log('Scraped tweets:', tweets);
    console.log('Number of tweets scraped:', tweets.length);

    // Insert tweets into the database
    for (const tweet of tweets) {
      db.getConnection((err, connection) => {
        if (err) {
          console.error('Error connecting to the database:', err);
          return;
        }

        const insertQuery = 'INSERT INTO tweets (tweet_text, user_name, created_at, query) VALUES (?, ?, ?, ?)';
        console.log('Executing query:', insertQuery);
        console.log('Query values:', [tweet.text, tweet.user, tweet.time, query]);

        connection.query(insertQuery, [tweet.text, tweet.user, tweet.time, query], (queryErr, results) => {
          if (queryErr) {
            console.error('Error executing query:', queryErr);
          } else {
            console.log('Inserted tweet into DB:', tweet.text);
          }

          connection.release();
        });
      });
    }

    return tweets;
  } catch (error) {
    console.error('Error during scraping:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeTweets };
