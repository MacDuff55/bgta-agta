# The Mark of a New Century

A calendar that splits time around the release of GTA VI.
Every day before the launch is **B.GTA** (Before GTA), every day after it is **A.GTA** (After GTA), and the release day itself, November 19, 2026, is **GTA Day**.

The whole thing is a single `index.html`: no build step, no dependencies, no tracking.

## Features

- **Live counter** that shows the days left before release (with an hours, minutes and seconds countdown) and the days since release afterwards
- **Stats** for weeks and months on either side of the launch, plus the days left to the next milestone
- **Month calendar** where every day carries its `B` or `A` number, with today, release day, weekends and milestones (every 100 days and each anniversary) marked
- **Day details**: tap any day to see its full date and where it falls on the B.GTA / A.GTA scale
- **Quick jumps** to today and to GTA Day
- **Navigation** with buttons, swipes on touch screens, the `←` `→` keys, or `T` for today
- **English and Turkish**, picked from the browser language and switchable with a button (the choice is remembered)
- Responsive layout: a single column on phones and two columns on wide screens; animations are switched off when the system asks for reduced motion
- Updates on its own at midnight, so a tab left open stays correct

## Usage

Open `index.html` in any modern browser. To serve it locally:

```sh
python -m http.server 8000
```

then visit <http://localhost:8000>.

It also works as-is on GitHub Pages or any static host.

## Changing the release date

Rockstar has moved the date before. If it moves again, update the `RELEASE` constant at the top of the script in `index.html`, and the `releaseDateLine` text in both languages:

```js
const RELEASE = new Date(2026, 10, 19); // months are 0-based: 10 = November
```

## License

[CC0 1.0 Universal](LICENSE): public domain.
