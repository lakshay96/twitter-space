import puppeteer from 'puppeteer-extra'; // Import puppeteer-extra
import puppeteerStealth from 'puppeteer-extra-plugin-stealth'; // Import stealth plugin
import db from 'database/db'; // Assuming 'db' is a local module

// Use the stealth plugin to avoid detection
puppeteer.use(puppeteerStealth());

async function scrapeTweets(query) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,  // You can use headless mode, but can switch to false if needed
      slowMo: 50,      // Slow down Puppeteer actions to mimic human behavior
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }, // Set viewport size
    });

    const page = await browser.newPage();
    
    // Set custom User-Agent to avoid detection as a bot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Set extra headers to simulate real user browsing
    await page.setRequestInterception(true);
    page.on('route', (route, request) => {
      if (request.resourceType() === 'document') {
        route.continue({
          headers: {
            ...request.headers(),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://twitter.com/',
          },
        });
      } else {
        route.continue();
      }
    });

    // Retry logic for page.goto in case of navigation issues
    let navigationAttempts = 0;
    const maxAttempts = 5;  // Increase max attempts for robustness
    let navigationSuccess = false;

    while (!navigationSuccess && navigationAttempts < maxAttempts) {
      try {
        console.log(`Attempting to navigate to Twitter search page (Attempt ${navigationAttempts + 1})`);
        await page.goto(`https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query`, {
          waitUntil: 'networkidle2',  // Wait until the network is idle (can be more reliable than networkidle0)
          timeout: 60000,  
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
          time: node.querySelector('time')?.getAttribute('datetime') || 'No time available'
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
    throw error;  // Re-throw to propagate to API handler
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export { scrapeTweets };  // Use ES export for module export
