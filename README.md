# Poorvik's portfolio site

Plain HTML, CSS and a little JavaScript. There's no framework and no build step, so you can read and edit every line in any text editor.

## What each file does

| File | What it is |
|---|---|
| `index.html` | Home page, laid out as a book: cover, preface, contents, a two-page spread per chapter, how I work, toolkit, contact, back cover |
| `book.js` | Binds the home page's pages into a book and turns them with a 3D page flip (click, arrow keys or swipe) |
| `site.js` | The page-turn transition between pages, plus the fade-ins, margin contents and reading-progress line on chapter pages |
| `regime-allocation.html` | Chapter 1 (Project 1) case study: the regime backtest |
| `cross-asset-events.html` | Chapter 2 (Project 2) case study: the CPI and Fed event study |
| `ai-bubble.html` | Chapter 3 (Project 3) case study: AI vs the dot-com and housing bubbles |
| `style.css` | All the styling. Colours and fonts are the "design tokens" at the top |
| `chart.js` | Draws Project 1's interactive growth-of-$1 chart |
| `corr-chart.js` | Draws Project 2's interactive rolling-correlation chart |
| `corr-data.js` | The weekly stock-bond correlation behind that chart, from `event_lib.py` |
| `growth-data.js` | The numbers behind that chart, exported from `regime_lib.py` |
| `race-chart.js` | Draws Project 3's interactive "three booms on one clock" chart |
| `race-data.js` | The weekly leader-basket values behind that chart, from `bubble_lib.py` |
| `favicon.svg` | The little "P" icon in the browser tab |
| `images/` | Project charts (Project 2's start with `p2_`, Project 3's with `p3_`), plus `og-image.png`, the preview card LinkedIn shows |

## Before you share it: fill in these spots

Search the files for `EDIT:` to find each one.

1. **About.** Add a sentence about your school, degree or current role in the preface.
2. **Project code.** Upload each project to its own GitHub repo, `regime-allocation`, `cross-asset-events` and `ai-bubble` (see below), so the "View on GitHub" buttons work.

Your email, LinkedIn and `resume.pdf` (the copy without your phone number) are already in. To update the résumé later, save the new PDF over `resume.pdf`.

## Preview it on your Mac

Right-click `index.html` → Open With → Safari or Chrome. Don't use Finder's spacebar preview: it shows the page without its styling.

The book flips on your Mac too. The page-turn between the home page and a chapter only shows on the live site (browsers allow it on real web addresses, not on files), and works in Chrome, Edge and Safari 18.2+; other browsers get a soft fade.

## How the book works

Each `<section class="page">` inside `<main class="book">` in `index.html` is one page, in reading order. On a wide screen you see two pages side by side; on a phone, one at a time. You never have to number anything: page numbers, the numbers in the contents, and the label under the book all fill in by themselves.

Three attributes on a page control the extras:

- `data-title="Chapter 4"`: the label under the book when the page is open.
- `data-head="Some heading"`: the small running head at the top of the page.
- `data-plain`: no running head or page number (used on the covers).

Any link to a page's `id`, like `<a href="#toolkit">`, flips the book to that page.

## Add a chapter (a new project)

1. Copy `ai-bubble.html`, rename it (say `my-project.html`) and replace the text. Change `<span>Chapter</span>3` to the new number.
2. In `index.html`, copy the two `chapter-3` pages (the opener and the plate with the chart) and paste them after them. Change the ids to `chapter-4` and `chapter-4-plate`, then edit the text and the link.
3. Add a line for it to the contents list (`toc-list`), copying the chapter 3 line.
4. In `site.js`, add `"my-project.html": 4` to `ORDER`, so the page turns the right way.
5. Add a "Next chapter" box at the bottom of the chapter 3 page, copying the one on chapter 2.

If the new chapter makes the page count odd, `book.js` slips in a blank page so the back cover still lands at the back.

## Publish it free on GitHub Pages

1. Sign up at github.com. Your username becomes your web address.
2. Click **+ → New repository**, name it exactly `poorvikmp.github.io`, make it **Public**, and click **Create**.
3. Click **uploading an existing file**, drag in *everything inside* this folder (including the `images` folder), then **Commit changes**.
4. Go to **Settings → Pages**. Set *Source* to **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
5. After a minute or two, visit `https://<username>.github.io`.

## Update the site later (GitHub Desktop)

Uploading file by file works, but GitHub Desktop is easier once you make regular changes:

1. Install GitHub Desktop from desktop.github.com and sign in as `poorvikmp`.
2. **File → Clone repository**, pick `poorvikmp.github.io`, and keep the default folder, `Documents/GitHub/poorvikmp.github.io`. That folder is now your site.
3. Edit any files in that folder. GitHub Desktop lists every change automatically.
4. Type a short summary (e.g. "Update Project 2 chart"), click **Commit to main**, then **Push origin**.

The site redeploys within a minute or two. Every change you made goes up in one push.

## Put the project code on GitHub too

Create a public repo for each project. For `regime-allocation`, upload `regime_allocation.ipynb`, `regime_lib.py`, `fetch_data.py`, `report.md` and the `charts` folder. For `cross-asset-events`, upload `cross_asset_events.ipynb`, `event_lib.py`, `fetch_data.py`, `report.md`, `design.md`, and the `charts` and `data/events` folders. For `ai-bubble`, upload `ai_bubble.ipynb`, `bubble_lib.py`, `build_notebook.py`, `fetch_data.py`, `report.md`, `design.md` and the `charts` folder. GitHub displays notebooks directly, so recruiters can read yours without installing anything.

## Check the LinkedIn preview

Once the site is live, paste your URL into https://www.linkedin.com/post-inspector/ to see the preview card. If it looks old, the inspector refreshes it.
