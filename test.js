const CONFIG = require('./config').config;
const checkConfig = require('./config').checkConfig;

function main() {
  if (!checkConfig('issue_url', 'sprint_report_url')) {
    console.warn(JSON.stringify(CONFIG, null, 2));
    console.error("🙈 Check .env is configured!");
    return;
  }
  console.log("👍 config looks ok");
}

main();