require('dotenv').config();

const HOME = require('os').homedir();

const config = {
  report_file: process.env.REPORT_FILE || 'report.json',
  slide_file: process.env.SLIDE_FILE || 'sprint-report.pptx',

  // scaper vars
  issue_url: process.env.ISSUE_URL,
  sprint_report_url: process.env.SPRINT_REPORT_URL,

  // optional vars
  sprint_report_table_columns: process.env.SPRINT_REPORT_TABLE_COLUMNS || 6,
  chrome_user_profile_path: process.env.CHROME_USER_PROFILE_PATH || `${HOME}/Library/Application Support/Google/Chrome/Default`,
  chrome_exe_path: process.env.CHROME_EXE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',

  // slide defaults
  author: process.env.AUTHOR || '',
  revision: process.env.REVISION || '1.0',
  subject: process.env.SUBJECT || 'Sprint Review',
  title: process.env.TITLE || 'Team',

  font_display: process.env.FONT_DISPLAY || 'Arial',
  font: process.env.FONT || 'Arial',

  color_primary: process.env.COLOR_PRIMARY || '1C5EB0',
  color_secondary: process.env.COLOR_SECONDARY || '009999',

  color_title_font: process.env.COLOR_TITLE_FONT || 'FFFFFF',
  color_title_background: process.env.COLOR_TITLE_BACKGROUND || '1C5EB0',

  color_content_font: process.env.COLOR_CONTENT_FONT || '1A1A1A',
  color_content_background: process.env.COLOR_CONTENT_BACKGROUND || 'F7F7F7',

  color_end_font: process.env.COLOR_END_FONT || 'FFFFFF',
  color_end_background: process.env.COLOR_END_BACKGROUND || '1A1A1A',

  image_title_background: process.env.IMAGE_TITLE_BACKGROUND || 'assets/background.jpg',
  image_section_background: process.env.IMAGE_SECTION_BACKGROUND || 'assets/background.jpg',
  image_end_background: process.env.IMAGE_END_BACKGROUND || 'assets/background_end.jpg',

  text_overview: process.env.TEXT_OVERVIEW || 'Features',
  text_end_thanks: process.env.TEXT_END_THANKS || 'Thank you',
  text_end_credits: process.env.TEXT_END_CREDITS || 'Go Team! 👏',
};

function checkConfig(...args) {
  // console.log('🔧', args, JSON.stringify(this));
  let result = true;
  const props = args && args[0] ? args : Object.keys(this);
  // console.log('🔧', props);
  props.forEach(prop => {
    if (!this[prop]) {
      console.warn(`⚠️  expected env var '${prop.toUpperCase()}'`);
      result = false;
    }
  });
  return result;
};

exports.config = {
  ...config
}

exports.checkConfig = function (...args) {
  checkConfig = checkConfig.bind(config);
  return checkConfig(...args);
}
