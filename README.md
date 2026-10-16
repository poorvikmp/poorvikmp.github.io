# Poorvik's portfolio site

Plain HTML, CSS and a little JavaScript. There's no framework and no build step, so you can read and edit every line in any text editor.

## What each file does

| File | What it is |
|---|---|
| `index.html` | Home page: hero, featured project, skills, about, contact |
| `regime-allocation.html` | Project 1 case study: the regime backtest |
| `cross-asset-events.html` | Project 2 case study: the CPI and Fed event study |
| `style.css` | All the styling. Colours and fonts are the "design tokens" at the top |
| `chart.js` | Draws Project 1's interactive growth-of-$1 chart |
| `corr-chart.js` | Draws Project 2's interactive correlation bar chart |
| `growth-data.js` | The numbers behind that chart, exported from `regime_lib.py` |
| `favicon.svg` | The little "P" icon in the browser tab |
| `images/` | Project charts (Project 2's start with `p2_`), plus `og-image.png`, the preview card LinkedIn shows |

## Before you share it: fill in these spots

Search the files for `EDIT:` to find each one.

1. **Links.** Replace `YOUR-USERNAME` (GitHub), `YOUR-PROFILE` (LinkedIn) and `YOUR-EMAIL` in `index.html` and `regime-allocation.html`.
2. **Résumé.** Save your résumé in this folder as `resume.pdf`. The Résumé button links to it.
3. **About.** Add a sentence about your school, degree or current role.
4. **Project code.** Upload each project to its own GitHub repo, `regime-allocation` and `cross-asset-events` (see below), so the "View on GitHub" buttons work.

## Preview it on your Mac

Right-click `index.html` → Open With → Safari or Chrome. Don't use Finder's spacebar preview: it shows the page without its styling.

## Add another project

In `index.html`, find `MORE PROJECTS`. Delete that line and the `END -->` line below it so the grid appears, then fill in the card. Copy the card once for each project.

## Publish it free on GitHub Pages

1. Sign up at github.com. Your username becomes your web address.
2. Click **+ → New repository**, name it exactly `<username>.github.io`, make it **Public**, and click **Create**.
3. Click **uploading an existing file**, drag in *everything inside* this folder (including the `images` folder), then **Commit changes**.
4. Go to **Settings → Pages**. Set *Source* to **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
5. After a minute or two, visit `https://<username>.github.io`.

To update the site later, upload the changed files the same way, and it redeploys on its own.

## Put the project code on GitHub too

Create a public repo for each project. For `regime-allocation`, upload `regime_allocation.ipynb`, `regime_lib.py`, `fetch_data.py`, `report.md` and the `charts` folder. For `cross-asset-events`, upload `cross_asset_events.ipynb`, `event_lib.py`, `fetch_data.py`, `report.md`, `design.md`, and the `charts` and `data/events` folders. GitHub displays notebooks directly, so recruiters can read yours without installing anything.

## Check the LinkedIn preview

Once the site is live, paste your URL into https://www.linkedin.com/post-inspector/ to see the preview card. If it looks old, the inspector refreshes it.
