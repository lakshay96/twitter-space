const puppeteer = require('puppeteer');

// Function to scrape tweets based on search query
async function scrapeTweets(query) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query`);
  
  const tweets = await page.evaluate(() => {
    const tweetNodes = document.querySelectorAll('article');
    const tweetData = [];
    
    tweetNodes.forEach(node => {
      const tweet = {
        text: node.querySelector('div[lang]')?.textContent,
        user: node.querySelector('div > div > div > div > div > a')?.textContent,
        time: node.querySelector('time')?.getAttribute('datetime')
      };
      tweetData.push(tweet);
    });

    return tweetData.slice(0, 10);  // Return only top 10 tweets
  });

  await browser.close();
  return tweets;
}

module.exports = { scrapeTweets };
