# The Mark of a New Century

A calendar that splits time around the release of GTA VI.
Every day before the launch is **B.GTA** (Before GTA), every day after it is **A.GTA** (After GTA), and the release day itself, November 19, 2026, is **GTA Day**.

**Live:** <https://macduff55.github.io/bgta-agta/>

Plain HTML, CSS and JavaScript: no build step, no dependencies, no tracking.

## Features

- **Live counter**: days left before release with an hours, minutes and seconds countdown, then days since release
- **Stats**: weeks and months on either side of the launch, plus days to the next milestone
- **Month and year views**: every day carries its `B` or `A` number; today, release day, weekends, milestones (every 100 days and each anniversary) and news events are marked
- **GTA VI timeline**: announcement, trailers and delays, each dated in B.GTA
- **Date converter**: turn any date into its B.GTA / A.GTA code, or type a code such as `A214` to get the date
- **Share card**: a square image of any day, ready for a story or a group chat, with share, download and copy-link buttons
- **Deep links**: `?d=2027-06-21` opens the calendar, converter and card on that date
- **Installable app (PWA)**: add it to the home screen, use it offline; on supporting platforms the app icon shows today's number as a badge
- **Themes**: night (synthwave), sunset (Vice City daytime) and light, or automatic from the system setting
- **English and Turkish**, picked from the browser language and switchable
- Navigation with buttons, swipes, the `←` `→` keys, or `T` for today; animations are switched off when the system asks for reduced motion

## Project layout

```
index.html               page markup and icon sprite
manifest.webmanifest     PWA manifest
sw.js                    service worker (offline cache)
assets/css/style.css     styles and the three themes
assets/js/app.js         UI logic
assets/js/dates.js       release date and B.GTA / A.GTA maths
assets/js/i18n.js        English and Turkish strings
assets/js/events.js      timeline events
assets/js/share.js       share card drawing
assets/icons/            app icons
assets/og.png            link preview image
```

## Running locally

The scripts are ES modules, so the page needs to be served over HTTP rather than opened as a file:

```sh
python -m http.server 8000
```

then visit <http://localhost:8000>.

## Deployment

GitHub Pages publishes the root of `main`. Every push to `main` goes live within a minute or two. `.nojekyll` keeps Pages from running Jekyll on the files.

When you change any file listed in `sw.js`, bump its `CACHE` name (`bgta-v1` → `bgta-v2`) so installed copies pick up the new version.

## Changing the release date

Rockstar has moved the date before. If it moves again, update `RELEASE` in `assets/js/dates.js` and `releaseDateLine` for both languages in `assets/js/i18n.js`:

```js
export const RELEASE = new Date(2026, 10, 19); // months are 0-based: 10 = November
```

Add the delay to `assets/js/events.js` too.

## Adding events

Append an entry to `assets/js/events.js`:

```js
{ date:'2027-03-01', type:'update', en:'First story DLC', tr:'İlk hikâye DLC’si' }
```

`type` picks the icon: `announce`, `trailer`, `delay`, `release` or `update`.

## License

[CC0 1.0 Universal](LICENSE): public domain. Not affiliated with Rockstar Games.
