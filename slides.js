// Generates pptx report file from json file

// Documentation:
// https://gitbrent.github.io/PptxGenJS/docs/

const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);
const groupByKey = require('./group').groupByKey;
const CONFIG = require('./config').config;
const checkConfig = require('./config').checkConfig;

// Config
const REPORT_FILE = CONFIG.report_file;
const SLIDE_FILE = CONFIG.slide_file;

// Console
const TAG = '  ';

// Colors
const C = {
  // title slide
  titleFont: CONFIG.color_title_font,
  titleBackground: CONFIG.color_title_background,
  // content slide
  contentFont: CONFIG.color_content_font,
  contentBackground: CONFIG.color_content_background,
  // end slide
  endFont: CONFIG.color_end_font,
  endBackground: CONFIG.color_end_background,
  // accents
  primary: CONFIG.color_primary,
  secondary: CONFIG.color_secondary,
  // neutrals 
  black: '1A1A1A',
  charcoal: '545454',
  gray: 'B7B6B7',
  gray_lite: 'CCCCCC',
  platinum: 'F7F7F7',
  white: 'FFFFFF'
};

// Default 'LAYOUT_16x9' 10 x 5.625 inches, 'LAYOUT_16x10' 10 x 6.25 inches, 'LAYOUT_4x3' 10 x 7.5 inches, 'LAYOUT_WIDE' 13.3 x 7.5 inches
const LAYOUT = 'LAYOUT_16x9';

// Slide Measurements based on 'LAYOUT_16x9' 10 x 5.625 inches
const M = {
  margin: 0.5,
  width: 10,
  height: 5.625,
};

// Position vars
const W = M.width - M.margin * 2;
const H = M.height - M.margin * 2;
const X = M.margin;
const Y = M.margin;
const X_MID = W / 2;
const Y_MID = H / 2;
const X_BOX = M.margin / 2;
const Y_BOX = M.margin / 2;
const W_BOX = M.width - X_BOX;
const H_BOX = M.height - Y_BOX;

// Slide constants
const LINE_SPACING_RATIO = 1.3;

// Slide properties and master slide templates
const S = {
  layout: LAYOUT,
  author: CONFIG.author,
  revision: CONFIG.revision,
  subject: CONFIG.subject,
  title: CONFIG.title,
  MASTER: {
    TITLE: {
      key: 'TITLE',
      color: C.titleFont,
      backgroundColor: C.titleBackground,
      backgroundImage: CONFIG.image_title_background,
      align: 'left',
      margin: M.margin,
      logo: 'assets/logo-screen.png',
    },
    SECTION: {
      key: 'SECTION',
      color: C.titleFont,
      backgroundColor: C.titleBackground,
      backgroundImage: CONFIG.image_section_background,
      align: 'left',
      margin: M.margin
    },
    CONTENT: {
      key: 'CONTENT',
      color: C.contentFont,
      backgroundColor: C.contentBackground,
      align: 'left',
      margin: M.margin,
      logo: 'assets/logo-icon.png',
      logoBackground: 'assets/gradient-line.jpg'
    },
    END: {
      key: 'END',
      color: C.endFont,
      backgroundColor: C.endBackground,
      backgroundImage: CONFIG.image_end_background,
      align: 'center',
      margin: M.margin
    },
  },
  PLACEHOLDER_ID: {
    title: 'title',
    body: 'body',
    footer: 'footer',
  },
  FONT: {
    FACE: {
      display: CONFIG.font_display,
      default: CONFIG.font,
    },
    SIZE: {
      title: 63,
      subtitle: 45,
      header: 31,
      body: 16,
      footer: 14,
      tiny: 11,
    }
  },
  TEXT: {
    TRUNCATE: {
      subtitle: 44
    }
  },
  SIZING: {
    cover: 'cover',
    contain: 'contain',
    crop: 'crop',
  },
  BULLET: {
    CODE: {
      arrow_angle: '276F',
      arrowhead: '27A4',
      circle: '2022',
      circle_outline: '26AC',
      circled_arrow: '27B2',
      queen: '265B',
      star: '2605',
      star_2: '272D',
      star_circle: '2713',
      tick: '2713',
      tick_2: '2714',
    },
    marginPt: 10,
  }
};

const defineMasterSlides = async (pptx) => {
  const barHeight = 0.4;

  let template;
  let lineHeight = 1;
  let vspace = 0;
  let bodyHeight = H;

  // title template
  lineHeight = inch(Math.ceil(S.FONT.SIZE.title * LINE_SPACING_RATIO));
  console.log(TAG, `lineHeight title: ${lineHeight}`);
  bodyHeight = H - lineHeight - barHeight - vspace;
  template = S.MASTER.TITLE;
  pptx.defineSlideMaster({
    title: template.key,
    background: await backgroundImageOrColor(template.backgroundImage, template.backgroundColor),
    margin: template.margin,
    objects: [
      { image: { x: X, y: 4.6, w: inch(288, true), h: inch(62, true), data: await getImageB64(template.logo), sizing: {type: S.SIZING.contain} } },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.title, type: "title", x: X, y: Y, w: W, h: lineHeight, align: template.align, fontFace: S.FONT.SIZE.display, fontSize: S.FONT.SIZE.title, color: template.color },
          text: "Title",
        },
      },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.body, type: "body", x: X, y: Y + lineHeight, w: W, h: lineHeight, align: template.align, fontFace: S.FONT.SIZE.display, fontSize: S.FONT.SIZE.subtitle, color: template.color },
          text: "Subtitle",
        },
      },
    ]
  });

  // section template
  lineHeight = inch(Math.ceil(S.FONT.SIZE.header * LINE_SPACING_RATIO));
  console.log(TAG, `lineHeight header: ${lineHeight}`);
  vspace = M.margin;
  bodyHeight = H - lineHeight - vspace;
  template = S.MASTER.SECTION;
  pptx.defineSlideMaster({
    title: template.key,
    background: await backgroundImageOrColor(template.backgroundImage, template.backgroundColor),
    margin: template.margin,
    objects: [
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.title, type: "title", x: X, y: Y, w: W, h: lineHeight, align: template.align, fontFace: S.FONT.SIZE.display, fontSize: S.FONT.SIZE.header, color: template.color },
          text: "Overview",
        },
      },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.body, type: "body", x: X, y: Y + lineHeight + vspace, w: W, h: bodyHeight, align: template.align, fontFace: S.FONT.SIZE.display, fontSize: S.FONT.SIZE.body, color: template.color },
          text: "Contents",
        },
      },
    ]
  });

  // content template
  bodyHeight = H_BOX - lineHeight - barHeight - vspace;
  template = S.MASTER.CONTENT;
  const imageWidth = inch(222, true)/4;
  const imageMargin = inch(10, true);
  const pixel = inch(1, false);
  pptx.defineSlideMaster({
    title: template.key,
    background: await backgroundImageOrColor(template.backgroundImage, template.backgroundColor),
    margin: template.margin,
    objects: [
      { rect: { x: X_BOX, y: Y_BOX + lineHeight + vspace, w: W_BOX, h: bodyHeight, fill: { color: C.gray_lite } } },
      { rect: { x: X_BOX, y: M.height - barHeight, w: W_BOX, h: barHeight, fill: { color: C.secondary } } },
      { image: { x: X_BOX, y: M.height - barHeight, w: W, h: barHeight, data: await getImageB64(S.MASTER.CONTENT.logoBackground), sizing: { type: S.SIZING.cover } } },
      { image: { x: W_BOX - imageWidth, y: M.height - barHeight + imageMargin, w: imageWidth, h: inch(127, true)/4, data: await getImageB64(S.MASTER.CONTENT.logo), sizing: { type: S.SIZING.contain } } },
      { rect: { x: X + W/2, y: Y_BOX + lineHeight + vspace, w: W/2 + X, h: bodyHeight, fill: { color: C.gray_lite } } },
      { line: { x: X_BOX, y: M.height - barHeight, w: W_BOX + pixel, h: 0, line: { width: 1, color: C.white } } },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.title, type: "title", x: X, y: Y, w: W, h: lineHeight, align: template.align, fontFace: S.FONT.FACE.display, fontSize: S.FONT.SIZE.header, color: template.color, isTextBox: true, fit: 'shrink', shrinkText: true, wrap: false },
          text: "Feature",
        },
      },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.body, type: "body", x: X, y: Y + lineHeight + vspace, w: W/2, h: bodyHeight - barHeight, align: template.align, fontFace: S.FONT.FACE.default, fontSize: S.FONT.SIZE.body, color: template.color },
          text: "Contents",
        },
      },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.footer, type: "body", x: X, y: M.height - barHeight, w: M.width - X - imageWidth - X_BOX, h: barHeight, align: 'right', valign: 'middle', fontFace: S.FONT.FACE.footer, fontSize: S.FONT.SIZE.body, color: C.white },
          text: "Footer",
        },
      },
    ],
  });

  // end template
  template = S.MASTER.END;
  lineHeight = inch(Math.ceil(S.FONT.SIZE.title * LINE_SPACING_RATIO));
  vspace = 0;
  pptx.defineSlideMaster({
    title: template.key,
    background: await backgroundImageOrColor(template.backgroundImage, template.backgroundColor),
    margin: template.margin,
    objects: [
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.title, type: "title", x: X, y: Y_MID, w: W, h: lineHeight, align: template.align, fontFace: S.FONT.FACE.display, fontSize: S.FONT.SIZE.title, color: template.color },
          text: "Thank you",
        },
      },
      {
        placeholder: {
          options: { name: S.PLACEHOLDER_ID.body, type: "body", x: X, y: Y_MID + lineHeight + vspace, w: W, h: lineHeight, align: template.align, fontFace: S.FONT.FACE.display, fontSize: S.FONT.SIZE.subtitle, color: template.color },
          text: "Credits",
        },
      },
    ],
  });
};

// Convert pixels to inch. (use hd for images to display @2x)
const inch = (px, hd = false, precision = 2, dpi = 72 ) => {
  return parseFloat((px * 1 / (dpi * (hd ? 2 : 1))).toFixed(precision));
}

const truncateWords = (str, limit) => {
	const words = str.split(' ');
	let sb = '';
	for (const w of words) {
		if (sb.length + w.length < limit) {
			sb += w + ' ';
		} else if (sb.length === 0) {
			return str.substring(0, limit) + '…';
		} else {
			return sb;
		}
	};
	return sb;
}

const validImage = async (imagePath, supportedImageTypes = ['jpg','png','gif']) => {
  if (!imagePath) {
    return false;
  }
  const ext = path.extname(imagePath).substring(1);
  if (!supportedImageTypes.includes(ext) || !await exists(imagePath)) {
    console.warn(TAG, `* Image not found or invalid type '${ext}'`, imagePath);
    return false;
  }
  return true;
}

const getImageB64 = async (
  imagePath,
  fallback = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  supportedImageTypes = ['jpg','png','gif']
) => {
  const ext = path.extname(imagePath).substring(1);
  if (!supportedImageTypes.includes(ext)) {
    console.warn(TAG, `* Unsupported image type '${ext}'`, imagePath);
    return fallback;
  }
  if (!await exists(imagePath)) {
    console.warn(TAG, '* Image not found:', imagePath);
    return fallback;
  }
  // base64 is the recommended option for encoding images
  // https://gitbrent.github.io/PptxGenJS/docs/api-images.html
  return `image/${ext};base64,` + Buffer.from(await readFile(imagePath), 'binary').toString('base64');
}

const backgroundImageOrColor = async (backgroundImage, backgroundColor, sizing = { type: 'contain' } ) => {
  return await validImage(backgroundImage) ? { data: await getImageB64(backgroundImage), sizing } : { fill: backgroundColor };
};

// Add Content Slides
const addContentSlide = (pptx, epic, developer, tickets) => {
  const slide = pptx.addSlide({ masterName: S.MASTER.CONTENT.key });

  const titleText = truncateWords(epic, S.TEXT.TRUNCATE.subtitle);

  const bodyTextObjects = tickets.reduce((arr, t) => {
    arr.push({ text: `${t.key}`, options: { breakLine: true, inset: 0, fontSize: S.FONT.SIZE.tiny, paraSpaceBefore: S.FONT.SIZE.footer, color: C.primary } });
    arr.push({ text: `${t.summary}`, options: { breakLine: true, bullet: { code: S.BULLET.CODE.circle, marginPt: S.BULLET.marginPt }, fontSize: S.FONT.SIZE.body } }); // indentLevel: 0, inset: 0, 
    return arr;
  }, []);
 
  slide.addText(titleText, { placeholder: S.PLACEHOLDER_ID.title, fit: 'shrink', shrinkText: true, wrap: false });
  slide.addText(bodyTextObjects, { placeholder: S.PLACEHOLDER_ID.body });
  slide.addText(developer, { placeholder: S.PLACEHOLDER_ID.footer, valign: 'middle' });
  // slide.addNotes(developer);

  // Slide color and background
  slide.color = S.MASTER.CONTENT.color;
  slide.background = { fill: S.MASTER.CONTENT.backgroundColor };
}

const createSlides = async (tickets) => {
  // console.log(TAG, 'create slides');

  // 1. Create a new Presentation with options
  const pptx = new pptxgen();
  pptx.layout = S.layout;
  pptx.author = S.author;
  pptx.company = S.company;
  pptx.revision = S.revision;
  pptx.subject = S.subject;
  pptx.title = S.title;

  // 1. Define master slides
  await defineMasterSlides(pptx);

  // 2. Add slide and format
  const slideStart = pptx.addSlide(S.MASTER.TITLE.key);
  slideStart.color = S.MASTER.TITLE.color;

  // 3. Add slide content
  slideStart.addText(S.title, { placeholder: S.PLACEHOLDER_ID.title } );
  slideStart.addText(S.subject, { placeholder: S.PLACEHOLDER_ID.body } );

  // Add overview slide
  const slideOverview = pptx.addSlide(S.MASTER.SECTION.key);

  // Data for overview - group tickets by epic, sorted by summary
  const epicTicketsGroup = groupByKey(tickets, 'epic', 'summary');
  const keys = Object.keys(epicTicketsGroup);

  const epicBullets = keys.map(text => ({ text, options: { bullet: {code: S.BULLET.CODE.tick, marginPt: S.BULLET.marginPt}, paraSpaceBefore: S.FONT.SIZE.tiny } }));

  const newline = '\n';
  const tab = '  ';
  const bullet = '•';
  const bullet2 = '◦';
  
  const slideNotes = keys.reduce((arr, key) => {
    const epicTickets = epicTicketsGroup[key];
    arr.push(`${bullet} ${key}`);
    arr.push( epicTickets.map(t => `${tab}${bullet2} ${t.summary}`).join(newline) );
    return arr;
  }, []).join(newline);

  slideOverview.addText(CONFIG.text_overview, { placeholder: S.PLACEHOLDER_ID.title });
  slideOverview.addText(epicBullets, { placeholder: S.PLACEHOLDER_ID.body });
  slideOverview.addNotes(slideNotes);
  
  // Data for contents - add slides by epic for each developer
  Object.keys(epicTicketsGroup).forEach(key => {
    const epicTickets = epicTicketsGroup[key];
    // Grouped by developer sorted by status (default)
    const devTicketsGroup = groupByKey(epicTickets, 'developer');
    Object.keys(devTicketsGroup).forEach(developer => {
      const devTickets = devTicketsGroup[developer];
      const ticketIds = devTickets.map(t => t.key).join(', ');
      console.log(TAG, 'Slide:', key, ticketIds, developer, devTickets.length ,'/', epicTickets.length);
      addContentSlide(pptx, key, developer, devTickets);
    })
  });

  // Add end "Thank you" slide
  const slideEnd = pptx.addSlide(S.MASTER.END.key);
  slideEnd.addText(CONFIG.text_end_thanks, { placeholder: S.PLACEHOLDER_ID.title });
  slideEnd.addText(CONFIG.text_end_credits, { placeholder: S.PLACEHOLDER_ID.body });

  // 4. Save the file
  pptx.writeFile(SLIDE_FILE);
  console.log(`📝 saved slides: ${SLIDE_FILE}`);
}

const runCheckConfig = () => {
  if (!checkConfig()) {
    console.warn(JSON.stringify(CONFIG, null, 2));
    console.error("🙈 Check .env is configured!");
    return false;
  }
  console.log("👍 config looks ok");
  return true;
}

async function main() {
  // if (!runCheckConfig()) return;
  // console.log(JSON.stringify(CONFIG, null, 2)); // print config

  const file = REPORT_FILE;
  const doesReportFileExist = await exists(file);
  if (!doesReportFileExist) {
    console.error(`😞 Please run 'npm start' to generate the report file: ${file}`);
    return;
  }
  const json = await readFile(file);
  const tickets = JSON.parse(json);
  console.log('🤖 generate slides...');
  await createSlides(tickets);
  console.log('🎉 slides done');
}

main();
