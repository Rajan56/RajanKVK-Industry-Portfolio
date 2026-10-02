# Rajan Kumar V K, D.Sc. (Tech.) | Industry portfolio

Performance and KPI analytics, process improvement, digital twins and sustainability performance for industrial companies.

**Live site:** https://rajan56.github.io/RajanKVK03Portfolio/

## What is on the page

| Section | Content |
|---|---|
| What I solve | Four problem areas: performance and KPI analytics, process improvement and quality, digital transformation and digital twins, sustainability performance and reporting |
| Live labs | Four browser simulations: EBITDA margin bridge, control chart with capability and Welch t test, three-station production line twin, and the framework from my doctoral dissertation |
| Project work | Links to six live prototypes in my other repositories |
| Tools | Each tool is marked live only when a public demo made with it exists |
| Funding and grant writing | Grant and funding application experience |
| About | Background, education, certificates, teaching and publications |

## How the simulations work

- **Margin bridge.** EBITDA = volume x price, minus (volume / (1 - scrap)) x (material + energy use x energy price), minus fixed costs. Driver effects are applied in sequence so the bars sum exactly to the total change.
- **Control chart.** Individuals chart with limits from the first 20 samples (average moving range / 1.128). Signals: a point beyond three sigma, or eight in a row on one side of the centre line. Cpk on the last 20 samples. Welch t test with the p value from numerical integration of the t density.
- **Line twin.** The slowest station sets the pace. OEE = availability x performance x quality. Energy per good unit combines running and idle load.
- **Framework.** Technology streams from a systematic review of 67 studies, and path coefficients from structural equation modelling on 179 SME responses (see publications on the page).

All figures in the simulations are illustrative and the companies are fictional.

## Run locally

No build step. Open index.html, or serve the folder with: python -m http.server 8000

## Structure

    index.html
    css/style.css
    js/app.js
    assets/rajan.jpg
