# NOVA Gaming Directory

NOVA is a responsive gaming directory for discovering curated games by title, genre, platform, and tags. It includes featured recommendations, game details, saved favourites, and light and dark themes.

## Preview
https://princely24m.github.io/Nova-Gaming/

## Features

- Search the catalog by game title, genre, or tag.
- Filter by genre, platform, and featured status; sort the results.
- Browse a featured-game carousel and recommended games.
- Open game details and save favourites.
- Keep favourites, filters, and theme preferences in browser storage.
- Use the responsive navigation and theme controls on mobile or desktop.
- Explore a cinematic hero with slow image movement, parallax, and ambient cyan/violet particles.
- See subtle pointer-driven card tilt, hover lighting, and staggered result entrances on supported devices.
- Navigate with active-section feedback and one-time scroll reveals.

## Motion and accessibility

Motion is implemented with CSS, vanilla JavaScript, the Web Animations API, `IntersectionObserver`, and an HTML canvas. The particle field is capped at 30 frames per second and pauses while the page is hidden. Card tilt is limited to fine-pointer devices, and result animations are debounced.

NOVA respects `prefers-reduced-motion`: it disables the particle field, scroll reveals, hero auto-advance, and nonessential animation while keeping all content and controls available. No animation frameworks or runtime dependencies are required.

## Run locally

NOVA is a static site and does not require a build step or package installation. Serve the project directory over HTTP so the browser can load the JSON catalog:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000). You can also use the VS Code Live Server extension.

## Project structure

```text
.
├── index.html
├── css/
│   └── style.css
├── data/
│   └── games.json
├── images/
│   ├── NOVA Logo.png
│   └── NOVA Logo Light Mode.png
├── js/
│   └── app.js
└── video/
    └── Form background.mp4
```

## Game catalog

The directory loads its entries from `data/games.json`, which is a JSON array. To add or update a game, edit that file and follow the existing entry format. Entries include an ID, name, category, platforms, description, image and attribution, tags, featured status, and supporting display text. Keep the JSON valid; the browser reads it when the page loads.

Game artwork in the catalog is served from external store image URLs, so those images require an internet connection. The NOVA logos and form background video are stored in this repository.

## FAQ

### Why does the page need to run from a local server?
The app loads `data/games.json` with the browser Fetch API. Opening `index.html` directly as a `file://` URL may block that request. Start the HTTP server above, then visit its local address.

### How do I add a game?
Add an object to the array in `data/games.json`, following the neighboring entries and using a unique `id`. Provide its category, platforms, tags, and image details so it can be searched and displayed correctly.

### Where are favourites and preferences stored?
They are saved in your browser's `localStorage` on the device and browser you use. They are not synced to an account or shared between browsers.

### Does NOVA need a backend or dependencies?
No. It is a static HTML, CSS, and JavaScript project with no build step. A local HTTP server is needed for development because the catalog is loaded as JSON.

### Can I turn off animations?
NOVA follows your operating system or browser's reduced-motion preference and disables nonessential motion automatically.

### Do all images work offline?
No. Game artwork uses external image URLs. The local logos and background video are included in the repository, but externally hosted artwork needs an internet connection.
