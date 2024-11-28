// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");

// Import 'jsdom' to parse HTML string to HTML objects
const jsdom = require("jsdom");

// Import 'dotenv' to read enviroment variables and load them into the process
require("dotenv").config();


async function sortHackerNewsArticles() {
  // launch browser
  const browser = await chromium.launch({ headless: false });


  let context = await browser.newContext();
  context.clearCookies();
  context.clearPermissions();
  let page = await context.newPage();

  await page.route('**', route => route.continue());
  await page.goto("https://news.ycombinator.com/newest", { waitUntil: "domcontentloaded" });

  console.log("\n\nVALDATE ARTICLES ORDER: \n");
  // validate the article order "newest -> oldest"
  let articles_in_order = await validateByArticle(page);
  page.close();



  context = await browser.newContext();
  context.clearCookies();
  context.clearPermissions();
  page = await context.newPage();

  // go to Hacker News
  await page.route('**', route => route.continue());
  await page.goto("https://news.ycombinator.com/newest", { waitUntil: "domcontentloaded" });

  console.log("\n\nVALDATE POSTS ORDER: \n");
  // validate the post order "newest -> oldest"
  let posts_in_order = await validateByPost(page);
  page.close();



  if (articles_in_order == true)
    console.log("\n\n!!! ARTICLES ARE POSTED IN ORDER !!!\n\n");
  else
    console.log("\n\n!!! ARTICLES ARE NOT POSTED IN ORDER !!!\n\n");

  if (posts_in_order == true)
    console.log("\n\n!!! POSTS ARE POSTED IN ORDER !!!\n\n");
  else
    console.log("\n\n!!! POSTS ARE NOT POSTED IN ORDER !!!\n\n");

  process.exit(0);
}


async function validateByPost(page) {
  // Array that stores the HTML elements that keep the article links
  let articles = null;

  // Array that stores the times in which the posts were published
  times = [];

  while (times.length < 100) {
    // Get the HTML content of the current page loaded by Playwright
    let html = await page.content()

    // Convert the HTML content into DOM objects
    let dom = new jsdom.JSDOM(html);

    // If the 'articles' array is null extract the HTML elements that store the article links on the current page
    if (articles === null)
      articles = dom.window.document.getElementsByClassName("age");

    // Loop through the extracted 100 posts
    for (let i = 0; i < articles.length; i++) {
      if (times.length >= 100)
        break;

      // Extract the post initial time
      let time = articles.item(i).children.item(0).innerHTML;
      times.push(time);
      console.log(time);

      // Validate if the posts are in the correct chronolgical order (NEWEST -> OLDEST)
      if (times.length > 1) {
        let valid = ValidateTimes(times);
        if (valid === false) {
          console.log("\n\n!!! ARTICLES NOT IN ORDER !!!\n\n");
          return false;
        }
      }
    }

    articles = null;
    await sleep(1000);
    await page.getByText('More', { exact: true }).click();
  }

  return true;
}


function ValidateTimes(times) {
  if (times.length > 1) {

    // Create a dictionary stores and creates the association between the 
    // literal time unit values and their numerical values 
    let time_units = {
      "minutes": 0,
      "minute": 0,
      "hours": 1,
      "hour": 1,
      "day": 2,
      "days": 2,
      "month": 3,
      "months": 3,
      "year": 4,
      "years": 4,
    }


    // Get the last appended time index
    let last = times.length - 1;

    // Get the last appended time
    let cur_Time = times[last];

    // Split the time section by whitespace (e.g. '10 minutes ago' = ['10', 'minutes', 'ago'])
    let cur_Time_Sections = cur_Time.split(" ");

    // Store the time value (e.g. ['10', 'minutes', 'ago'] -> time_value = 10)
    let time_value = cur_Time_Sections[0];

    // Store the time unit value (e.g. ['10', 'minutes', 'ago'] -> time_unit = 'minutes')
    let time_unit = time_units[cur_Time_Sections[1]];


    // Loop through all the extracted time values
    for (let i = 0; i < times.length; i++) {

      // Get the time value at the current iteration
      let past_Time = times[i];

      // Split the time section by whitespace (e.g. '10 minutes ago' = ['10', 'minutes', 'ago'])
      let past_Time_Sections = past_Time.split(" ");

      // Store the time value (e.g. ['10', 'minutes', 'ago'] -> time_value = 10)
      let past_time_value = past_Time_Sections[0];

      // Store the time unit value (e.g. ['10', 'minutes', 'ago'] -> time_unit = 'minutes')
      let past_time_unit = past_time_value[past_Time_Sections[1]];


      // If the time unit at the current iteration is greater than the current time
      if (past_time_unit > time_unit)
        return false;
      // If the time unit at the current iteration is equal with the current time
      else if (past_time_unit === time_unit)
        // If the time value at the current iteration is greater than the current time
        if (past_time_value > time_value)
          return false;
    }

    return true;
  }
}

async function validateByArticle(page) {
  
  // Import the 'OpenAI' object to call the ChatGPT API
  const { OpenAI } = await import("openai/index.mjs");

  // Array that stores Y-Combinator article links
  let article_links = [];

  // Array that stores the HTML elements that keep the article links
  let articles = null;

  // Array that stores the dates in which the articles were published
  let dates = [];

  // While the number of article links is less than 100
  while (article_links.length < 100) {

    // Get the HTML content of the current page loaded by Playwright
    let html = await page.content()

    // Convert the HTML content into DOM objects
    let dom = new jsdom.JSDOM(html);

    // If the 'articles' array is null extract the HTML elements that store the article links on the current page
    if (articles === null)
      articles = dom.window.document.getElementsByClassName("titleline");

    for (let i = 0; i < articles.length; i++) {
      if (article_links.length >= 100)
        break;

      // Extract the article link
      let link = articles.item(i).children.item(0).href;

      // If an extracted link starts with 'item?' it means that it is a partial link from the same root URL.
      // The partial link will be appended to the root link 'https://news.ycombinator.com/' to form a valid absolute URL.
      if (link.startsWith("item?") == true)
        article_links.push("https://news.ycombinator.com/" + articles.item(i).children.item(0).href);
      else
        // Otherwise the link will be appended to the array as it is
        article_links.push(articles.item(i).children.item(0).href);
    }

    // Make the array null, so new objects can be processed within it 
    articles = null;

    // Use Playwright to select the button that loads the next news page and click on it
    await sleep(1000);
    await page.getByText('More', { exact: true }).click();
  }

  // Loop through the extracted 100 articles
  for (let i = 0; i < article_links.length; i++) {

    // Change the current Playwright page to the current extracted article link. Set the browser to wait until the DOM content is loaded.
    await page.route('**', route => route.continue());
    await sleep(1000);
    await page.goto(article_links[i], { waitUntil: "domcontentloaded" });

    // Get the root object of the page and read all the text content of the web page. 
    let page_content = await page.getByRole("document").first().innerText();

    // Load the 'OpenAI' object
    let gpt = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });


    // [ BEGIN ]
    //
    // In this section ([ BEGIN ] <-> [ END ]), a system prompt is built for ChatGPT to follow in order to process
    // the information after a certain set number of parameters. ChatGPT is instructed that it will receive the
    // current date, and that it must search for the date when the website article was published. If it does not
    // find any date it must respond with the word 'undefined', if the website includes only the current year it
    // must respond with the word 'current', if the website includes only a previous year it must respond with 
    // the date in the format '01/01/PREV_YEAR',and if the website's publishing date is in format 'X days ago', 
    // 'Y years ago' he must substract the time prom the current date and return the response in the format
    // dd/MM/yyyy.
    // 
    let date = `Current datetime: ${new Date().toLocaleDateString()}`;
    let begin_text = "<BEGIN>";
    let end_text = "<END>";
    let text = `\n\n${begin_text}\n${page_content}\n${end_text}`;

    let query = `${date + text}`;


    let task = "Your job is to find the date when a website was published. You must tripple check the data. The content of the website will be given to you in plain text. You must follow the following rules:";
    let daterule = "\n* You will receive at the begining of the web site content message the current date time in the format [Current datetime: DATE].";
    let contentrule = "\n* The content of the website will be placed between these 2 tags: <BEGIN> and <END>. The first occurence of the tag <BEGIN> marks the begining of the site's content and the last occcurence of the tag <END> marks the end of the  website's content.";
    let timemeasurementrule1 = "\n* If the website's publishing date includes only the current year, you must write as the response 'current'";
    let timemeasurementrule2 = "\n* If the website's publishing date includes only a past year, treat the publishing date as the 1/1/YEAR_FOUND, in yyyy-MM-dd format";
    let timemeasurementrule3 = "\n* If the website's publishing date is not found, you must write as the response 'undefined'";
    let timemeasurementrule4 = "\n* If the website's publishing date is in format 'X days ago', 'Y years ago', you must conclude that the publishing date is the CURRENT_DATE - X or CURRENT_DATE - Y, in yyyy-MM-dd format";
    let timemeasurementrule5 = "\n* If the website's publishing date includes only a year, treat the publishing date as the 1/1/YEAR_FOUND, in yyyy-MM-dd format";
    let responseformatrule1 = "\n* You must respond in only yyyy-MM-dd format if the date was found'";
    let responseformatrule2 = "\n* You must respond only with 'undefined' if the date was not found or any other query";

    let msg = `${task}\n${daterule}\n${contentrule}\n${timemeasurementrule1}\n${timemeasurementrule2}\n${timemeasurementrule3}\n${timemeasurementrule4}\n${timemeasurementrule5}\n${responseformatrule1}\n${responseformatrule2}`;

    //
    // [ END ]

    // Set the GPT model as 'gpt-4o-mini' and send the system and user message
    let completion = await gpt.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }, { role: 'system', content: msg }],
    });

    // Extract the result and push it into the array.
    let result = completion.choices[0]?.message?.content;
    dates.push(result);



    // Validate if the articles are in the correct chronolgical order (NEWEST -> OLDEST)
    console.log("Link: " + page.url());
    console.log("Date: " + result);

    if (dates.length > 1) {
      let valid = ValidateDates(dates);
      if (valid === false) {
        return false;
      }
    }

    console.log("\n\n");
  }

  return true;
}

function ValidateDates(dates) {
  // Get the last appended date
  let last = dates.length - 1;
  let cur_Date = dates[last];

  // Verify if any previous date is smaller than the current date.
  // Return false if any date smaller than the current date is found 
  if (cur_Date !== 'undefined')
    if (cur_Date !== 'current')
      for (let i = 0; i <= last; i++) {
        let prev_Date = dates[i];
        if (prev_Date !== 'undefined')
          if (prev_Date !== 'current')
            if (new Date(prev_Date) < new Date(cur_Date)) {
              return false;
            }
      }
  return true;
}

async function sleep(milliseconds){
  return new Promise((resolve)=>{
    setTimeout(resolve, milliseconds);
  })
}


(async () => {
  await sortHackerNewsArticles();
})();
