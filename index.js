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

const sprintTitleFormat = (code, milestone = 'M', sprint = 'S') => {
  if (code.indexOf(milestone) === -1
    || code.indexOf(milestone)+1 >= code.length
    || isNaN(parseInt(code.substr(code.indexOf(milestone)+1,1), 10))
    || code.indexOf(sprint) === -1
    || code.indexOf(sprint)+1 >= code.length
    || isNaN(parseInt(code.substr(code.indexOf(sprint)+1,1), 10))
    ) {
    return code;
  }
  return `Milestone ${code.substr(code.indexOf(milestone)+1,1)} Sprint ${code.substr(code.indexOf(sprint)+1,1)} in review`;
}

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

  const boardName = await page.evaluate(() => {
    const el = document.querySelector("#ghx-board-name");
    return el ? el.innerText : null;
  });

  const sprintLabel = await page.evaluate(() => {
    const el = document.querySelector("#ghx-items-trigger");
    return el ? el.innerText : null;
  });

  const sprintTitle = sprintTitleFormat(sprintLabel);

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

  const report = {
    boardName,
    sprintLabel,
    sprintTitle,
    tickets
  };

  console.log(TAG, 'report complete');

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
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

  await addPRInfo(ticket, tab);

  if (!page) {
    await tab.close();
  }

  console.log(TAG, `${key} done. added developer: ${ticket.developer}`);
}

async function addPRInfo(ticket, page) {
  const { key } = ticket;

  // Wait for Developer Status Panel element
  try {
    await page.waitForSelector('#viewissue-devstatus-panel_heading', { visible: true });
  } catch (err) {
    console.warn(`⚠️  ${key} No Development status panel found!`);
    return;
  }

  // Check if Developer Status Panel is collapsed
  const isDevStatusPanelCollapsed = await page.evaluate(() => {
    const el = document.querySelector("#viewissue-devstatus-panel");
    return el.classList.contains('collapsed');
  });

  // Toggle Development dropdown open (if not expanded)
  if (isDevStatusPanelCollapsed) {
    try {
      const toggleButton = await page.waitForSelector('#viewissue-devstatus-panel_heading > a', { visible: true, timeout: 3000 });
      await toggleButton.click();
    } catch (err) {
      console.warn(`⚠️  ${key} No Development status toggle button found!`);
      return;
    }
  }

  try {
    const link = await page.waitForSelector('a.summary[title^="Pull requests"]', { visible: true, timeout: 3000 });
    await link.click();
  } catch (err) {
    console.warn(`⚠️  ${key} No pull requests available.`);
    return;
  }

  // Await PR dialog
  try {
    await page.waitForSelector('a.pullrequest-link', { visible: true });
  } catch (err) {
    console.warn(`⚠️  ${key} No PR links.`);
    return;
  }

  // Click PR link (NB: maybe multiple PR links)
  const id = key.split(' ')[0];
  console.log(TAG, 'Find PR link with id:', id);
  const clickedLink = await page.evaluate(async (id) => {
    let prLink;
    const prLinks = Array.from(document.querySelectorAll('a.pullrequest-link'));
    if (prLinks.length === 1) {
      prLink = prLinks[0];
    } else if (prLinks.length > 1) {
      prLink = prLinks.find(el => el.innerText && el.innerText.includes(id));
    }
    if (!prLink) {
      return false;
    }
    await prLink.click();
    return true;
  }, id);

  if (!clickedLink) {
    console.warn(`⚠️  ${key} No PR link clicked.`);
    return;
  }

  // Await PR
  try {
    await page.waitForSelector('div.description', { visible: true });
  } catch (err) {
    console.warn(`⚠️  ${key} No PR description.`);
    return;
  }

  // Extract info and images from PR page...
  ticket.pr = {};
  ticket.pr.description = await page.evaluate(() => {
    const el = document.querySelector("div.description");
    return el ? el.innerText : null;
  });
  ticket.pr.imgs = await page.evaluate(() => {
    const els = document.querySelectorAll("div.description img");
    return els ? Array.from(els).map(el => el.src) : [];
  });

  console.log(TAG, `${key} PR info and images extracted`);
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