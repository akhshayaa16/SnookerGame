# SnookerGame

A lightweight browser-based snooker/pool game built with p5.js and Matter.js.

This repository contains a playable snooker demo implemented with vanilla JavaScript and the `p5` drawing loop. It is intended as a small project to learn physics simulation, canvas rendering, and basic game UI.

Contents
- `index.html` — main page that loads the sketch and assets
- `sketch.js` — p5.js setup and draw loop
- `physicsLogic.js` — physics integration and collision handling
- `balls.js` — ball objects and rendering
- `table.js` — table rendering and state
- `controls.js` — input handling
- `gameHud.js` — score and HUD
- `introScreen.js`, `modes.js`, `hints.js`, `fx.js` — UI and effects
- `libraries/` — third-party libraries (`p5.min.js`, `matter.js`)
- `fonts/` — font assets

Getting Started
---------------

Prerequisites
- A modern web browser (Chrome, Firefox, Safari)
- (Optional) A simple static file server for local development. Browsers may restrict some features when opening `index.html` directly from the filesystem.

Quick run (recommended)
1. Open a terminal in the project root.
2. Start a lightweight HTTP server. Examples:

```bash
# Python 3
python3 -m http.server 8000

# Or with Node (if you have http-server installed)
npx http-server -p 8000
```

3. Open the game at `http://localhost:8000` in your browser and click the canvas to start.

Run by opening file (not recommended)
- You can double-click `index.html` to open it from the filesystem, but some browsers block local resource access. Use the server approach for best results.

How to Play
-----------
- Use the mouse to aim and set power (controls are implemented in `controls.js`).
- The HUD shows score, current turn, and hints when available.
- The physics engine handles collisions, friction, and ball movement.

Development
-----------

Project structure
- Game loop and rendering: `sketch.js`.
- Physics and collision logic: `physicsLogic.js` and `balls.js`.
- Table and assets: `table.js`, `fonts/`, and `libraries/`.

Editing code
- Modify those JS files in your editor, then reload the browser to see changes.

Adding libraries or assets
- Drop additional libraries into `libraries/` and reference them in `index.html`.
- Place fonts or images in `fonts/` and load them from the code.

Debugging tips
- Open the browser DevTools console to see errors and logs.
- Add `console.log(...)` calls to inspect state (positions, velocities).

Testing changes quickly
- Use the HTTP server method above and enable live reload with tools like `live-server` or an editor extension.

Repository & Git
----------------
- A `.gitignore` file exists to avoid committing OS artifacts and build outputs.
- To commit the updated README locally:

```bash
git add README.md
git commit -m "Improve README: usage and development instructions"
git push
```

Notes & Troubleshooting
-----------------------
- If the canvas does not display, ensure `p5.min.js` is included (see `libraries/`).
- If physics behave strangely after edits, try resetting the simulation state (reload the page).
- Missing fonts: confirm files are present under `fonts/` and paths in `index.html` or JS match.

Contributing
------------
- Feel free to open issues or pull requests. Keep changes focused (feature or bugfix per PR) and include screenshots if UI-related.

License
-------
- Add a license file if you want to share this project publicly (MIT recommended for small demos).

Contact
-------
- For questions or help, open an issue in the GitHub repository.
