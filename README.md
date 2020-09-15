# Powerpoint slide generator for JIRA sprint report

### Prerequisites

- [Node v10+](https://nodejs.org/en/)

### Setup

```shell
npm install
```

#### Create .env file

```bash
touch .env
```

#### Enter required .env vars for JIRA scraper script.

```bash
# JIRA issue base url:
ISSUE_URL = ''
# JIRA report url of the closed sprint. Reports > Select sprint
SPRINT_REPORT_URL = ''
```

#### Enter Google Chrome .env vars

```bash
#Enter chrome://version/ into Chrome to find out the following info:
CHROME_USER_PROFILE_PATH = ''
CHROME_EXE_PATH = ''
```

### Run scraper and slide generator

```shell
npm start
```

### Run slide generator

```shell
npm run slides
```

### Slide + theme config .env vars

```bash
# SLIDES
AUTHOR = '🤖'
REVISION = '1.0'
SUBJECT = 'Sprint Review Demo'
TITLE = '🍩🐿️'

# Theme
FONT_DISPLAY = 'Roboto'
FONT = 'Roboto'

# Colors
COLOR_PRIMARY = '1C5EB0'
COLOR_SECONDARY = '009999'

COLOR_TITLE_FONT = 'FFFFFF'
COLOR_TITLE_BACKGROUND = '1C5EB0'

COLOR_CONTENT_FONT = '1A1A1A'
COLOR_CONTENT_BACKGROUND = 'F7F7F7'

COLOR_END_FONT = 'FFFFFF'
COLOR_END_BACKGROUND = '1A1A1A'

IMAGE_TITLE_BACKGROUND = 'assets/background.jpg'
IMAGE_SECTION_BACKGROUND = 'assets/background.jpg'
IMAGE_END_BACKGROUND = 'assets/background_end.jpg'

TEXT_OVERVIEW = 'Features at a glance'
TEXT_END_THANKS = 'Thank you'
TEXT_END_CREDITS = 'Go Team! 👏'
```

#### Enjoy :bowtie:
