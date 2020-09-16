// Scrape closed sprint report

const puppeteer = require ('puppeteer');
const fs = require('fs');
const CONFIG = require('./config').config;
const checkConfig = require('./config').checkConfig;

// JIRA issue base url
const ISSUE_URL = CONFIG.issue_url;

// Update this link with the report of the closed sprint. Reports > Select sprint
const SPRINT_REPORT_URL = CONFIG.sprint_report_url;
const SPRINT_REPORT_TABLE_COLUMNS = CONFIG.sprint_report_table_columns;

// Enter chrome://version/ into Chrome to find out the following info:
const CHROME_USER_PROFILE_PATH = CONFIG.chrome_user_profile_path;
const CHROME_EXE_PATH = CONFIG.chrome_exe_path;

// Config
const REPORT_FILE = CONFIG.report_file;

// Console
const TAG = '  ';

async function scrapeReport(url) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1024, height: 768 },
    executablePath: CHROME_EXE_PATH,
    userDataDir: CHROME_USER_PROFILE_PATH
  });

  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector('table.aui', { visible: true });
  
  console.log(TAG, 'sprint report loaded', url);

  const tickets = await page.evaluate((tableColumns) => {
    return Array.from(document.querySelectorAll('table.aui tr')).reduce((arr, tr) => {
      const values = Array.from(tr.querySelectorAll('td')).map(td => td.innerText);
      if (values.length !== tableColumns) {
        return arr;
      }
      arr.push({
        key: values[0],
        summary: values[1],
        issueType: values[2],
        priority: values[3],
        status: values[4],
        points: values[5]
      });
      return arr;
    }, []);
  }, SPRINT_REPORT_TABLE_COLUMNS);

  console.log(TAG, 'report ready');

  let i = tickets.length;
  let n = 0;
  while (i--) {
    await addTicketInfo(tickets[n], page);
    n += 1;
  }

  console.log(TAG, 'report complete');

  fs.writeFileSync(REPORT_FILE, JSON.stringify(tickets, null, 2));
  console.log(`📝 saved file ${REPORT_FILE}`);

  // auto close
  browser.close();
}

async function addTicketInfo(ticket, page) {
  const { key } = ticket;
  const ticketUrl = `${ISSUE_URL}${key}`;
  const tab = page || await browser.newPage();
  await tab.goto(ticketUrl);
  try {
    await tab.waitForSelector('#peoplemodule', { visible: true });
  } catch (err) {
    console.warn(`⚠️  ${key} No people module!`);
    return;
  }
  
  console.log(TAG, `page loaded ${key}`);

  // Add developer
  ticket.developer = await tab.evaluate(() => {
    const el = document.querySelector("span[data-name='Developer']");
    return el ? el.innerText : null;
  });

  // Add developers
  ticket.developers = await tab.evaluate(() => {
    const el = document.querySelector("span[data-name='Developers']");
    return el ? el.innerText : null;
  });

  // Add epic
  ticket.epic = await tab.evaluate(() => {
    const el = document.querySelector("div.type-gh-epic-link a");
    return el ? el.innerText : null;
  });

  if (!page) {
    await tab.close();
  }

  console.log(TAG, `${key} done. added developer: ${ticket.developer}`);
}

async function main() {
  if (!checkConfig('issue_url', 'sprint_report_url')) {
    console.warn(JSON.stringify(CONFIG, null, 2));
    console.error("🙈 Check .env is configured!");
    return;
  }
  console.log("👍 config looks ok");

  console.log('👤', 'You will have to login first time... then rerun the script!');

  await scrapeReport(SPRINT_REPORT_URL);
  console.log('🤖 scrape done', SPRINT_REPORT_URL);
}

main();