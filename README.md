# Math Defenders

Math Defenders is a small browser-based educational game built with Phaser.js. The player defends their ship by solving math equations launched by an enemy ship.

## How to run locally

A quick way to run a static build locally is to use Python's simple HTTP server from the project root:

```bash
cd /path/to/math_defenders
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project structure

- `index.html` - entry point
- `style.css` - simple styles
- `src/` - game source files
  - `main.js` - Phaser configuration
  - `scenes/` - Phaser scenes (Preloader, MainMenu, LevelSelect, Game, Shop, UI)
  - `classes/` - game classes (Player, Enemy, EquationBlock)

## Notes

- Progress is stored in `localStorage`.
- Assets are currently placeholder generated textures.

