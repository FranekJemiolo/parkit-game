# ParkIt - Procedural Parking Roguelite

A deterministic, seeded, procedurally generated parking roguelite game engine with adaptive gameplay director, seasonal world mutation, drivetrain-specific physics, replay system, and CI-driven balance intelligence reporting.

**Built for:** GitHub Pages static deployment  
**Engine:** Phaser 3  
**Architecture:** Modular system-based design  
**Testing:** Unit, simulation, integration, and fuzz testing  

---

## Features

### Core Gameplay
- **Top-down parking challenges** with precise physics
- **Procedural level generation** from seeds (deterministic)
- **Three drivetrain types:** FWD, RWD, AWD (each with unique physics)
- **Seasonal modifiers:** Summer (dry), Winter (icy), Rain (wet)
- **Adaptive Director AI:** Four personalities (Flow, Chaos, Teacher, Rival)
- **Boss missions:** Environmental challenge systems
- **Fuel & move economy:** Strategic resource management
- **Precision scoring:** Position accuracy, angle accuracy, efficiency

### Technical Features
- **Deterministic simulation:** Same seed = identical gameplay
- **Replay system:** Record and ghost replay runs
- **Garage progression:** Unlock cars, track best scores
- **Daily challenges:** Seed-based daily levels
- **Level sharing:** Share levels via URL parameters
- **GenAI asset pipeline:** Three-tier asset system (procedural → static → GenAI)
- **Single-file build:** Bundles to one HTML for GitHub Pages

### Development & Testing
- **Full test suite:** Unit, simulation, integration tests
- **Fuzz testing:** Seed-space chaos testing for stability
- **Balance analysis:** CI-generated intelligence reports
- **Automated CI/CD:** GitHub Actions pipeline
- **No auto-patching:** Human-reviewed balance recommendations only

---

## Architecture

### System Layer

The engine is built on a modular system architecture with strict separation of concerns:

```
ENGINE CORE
├── Game loop (Engine)
├── Scene bootstrap (GameScene)
└── System registry

SYSTEMS
├── InputSystem - Keyboard/mouse/touch handling
├── CarPhysicsSystem - FWD/RWD/AWD physics
├── ParkingSystem - Parking spot detection
├── ScoringSystem - Fuel, moves, precision scoring
├── SeasonSystem - World modifiers
├── GarageSystem - Progression & unlocks
├── ContentFactory - Procedural content generation
├── DirectorSystem - Adaptive gameplay AI
├── BalanceSystem - ONLY tuning applier
├── BossSystem - Environmental challenges
├── AssetManager - Three-tier asset loading
├── AudioSystem - Procedural audio
└── ReplaySystem - Input recording & playback
```

### Runtime Flow (Critical Order)

1. **Seed Generation** - Deterministic RNG initialization
2. **Season System** - Applies world modifiers
3. **Content Factory** - Generates car pool, boss, modifiers
4. **Director System** - Selects personality
5. **Balance System** - Applies tuning (ONLY system allowed to modify)
6. **Game Simulation** - Phaser loop with all systems
7. **Replay System** - Records run inputs
8. **Scoring System** - Computes final result
9. **Garage System** - Updates progression

### Non-Negotiable Rules

**FORBIDDEN:**
- Modifying physics outside CarPhysicsSystem + BalanceSystem
- Randomness without seed
- Direct scoring hacks inside gameplay
- Hidden global state mutations
- CI-side mutation of gameplay

**REQUIRED:**
- Deterministic simulation
- System isolation
- Seed-driven everything
- Explicit data flow

---

## Installation

### Local Development

```bash
# Clone the repository
git clone <repo-url>
cd parkit-game

# Install dependencies
npm install

# Run tests
npm test

# Run fuzz tests
npm run fuzz

# Generate balance report
npm run analyze

# Build for production
npm run build

# Validate project structure
npm run validate
```

### Development Server

```bash
# Serve the index.html with a local server
npx serve .
# or
python -m http.server 8000
```

---

## Project Structure

```
parkit-game/
├── index.html              # Development entry point
├── package.json            # Dependencies and scripts
├── src/
│   ├── config/
│   │   └── constants.js    # Game constants
│   ├── core/
│   │   ├── Engine.js       # Core game loop
│   │   ├── GameScene.js    # Phaser scene
│   │   └── utils.js        # Utilities & RNG
│   └── systems/            # All game systems
│       ├── InputSystem.js
│       ├── CarPhysicsSystem.js
│       ├── ParkingSystem.js
│       ├── ScoringSystem.js
│       ├── SeasonSystem.js
│       ├── GarageSystem.js
│       ├── DirectorSystem.js
│       ├── BalanceSystem.js
│       ├── ContentFactory.js
│       ├── BossSystem.js
│       ├── AssetManager.js
│       ├── ReplaySystem.js
│       └── AudioSystem.js
├── tests/
│   ├── testRunner.js       # Test runner
│   ├── unit/               # Unit tests
│   ├── simulation/         # Simulation tests
│   ├── integration/        # Integration tests
│   └── fuzz/               # Fuzz testing
│       ├── seed-fuzzer.js
│       ├── simulation-runner.js
│       └── anomaly-detector.js
├── tools/
│   ├── build.js            # Build system
│   ├── validate.js         # Project validation
│   └── balance-analyzer.js # Balance report generator
├── docs/
│   └── GENAI_ASSET_PROMPTS.md  # Asset generation prompts
├── assets/packs/           # Optional static assets
├── .github/workflows/
│   ├── deploy.yml          # CI/CD for master
│   └── release.yml         # Tag-based releases
└── dist/                   # Build output (generated)
    └── index.html          # Single-file production build
```

---

## Controls

- **Arrow Keys / WASD** - Drive
  - Up/W - Accelerate
  - Down/S - Reverse/Brake
  - Left/A - Steer left
  - Right/D - Steer right
- **R** - Restart level
- **Space** - Brake

---

## Gameplay Mechanics

### Scoring

Final score = (Parking Quality + Time Bonus) - Move Penalty - Fuel Penalty

**Parking Quality:**
- Position accuracy (60% weight)
- Angle accuracy (40% weight)
- Perfect alignment = 100 points

**Move Penalty:**
- Each meaningful input change counts as a move
- Penalty scales exponentially with move count
- Encourages smooth, planned driving

**Fuel Economy:**
- Movement consumes fuel
- Steering consumes fuel
- Reverse is 1.45x more expensive
- Strategic resource management

### Director Personalities

1. **Flow** - Stable, forgiving gameplay (grip: 1.0, traffic: 0.8, tolerance: 1.1)
2. **Chaos** - High variance, unpredictable (grip: 0.85, traffic: 1.5, tolerance: 0.9)
3. **Teacher** - Forgiving learning environment (grip: 1.1, traffic: 0.5, tolerance: 1.3)
4. **Rival** - Competitive pressure (grip: 0.9, traffic: 1.2, tolerance: 0.85)

### Seasonal Modifiers

- **Summer** - Dry roads, normal grip (1.0)
- **Winter** - Icy roads, reduced grip (0.6)
- **Rain** - Wet roads, medium grip (0.8)

### Drivetrain Physics

- **FWD** - More responsive steering, stable
- **RWD** - Aggressive acceleration, oversteer tendency
- **AWD** - Consistent grip, stable turning

---

## Deployment

### GitHub Pages (Automatic)

Push to `master` branch triggers automatic deployment:

1. CI validates project structure
2. Runs all tests
3. Runs fuzz testing (500 iterations)
4. Generates balance report
5. Builds single-file bundle
6. Deploys to GitHub Pages
7. Uploads balance report as artifact

### Tagged Releases

Create a version tag for release builds:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the release workflow which:
- Runs full test suite
- Runs extended fuzz testing (1000 iterations)
- Creates versioned release artifact (ZIP)
- Uploads to GitHub Releases

---

## Testing

### Run All Tests

```bash
npm test
```

### Run Fuzz Tests

```bash
npm run fuzz
# Or with custom iterations
node tests/fuzz/seed-fuzzer.js 1000
```

### Generate Balance Report

```bash
npm run analyze
```

Balance reports are generated in `reports/`:
- `balance-report.json` - Machine-readable
- `balance-report.md` - Human-readable

---

## Asset System

The asset manager uses a three-tier loading system:

1. **L0 (Procedural)** - Canvas-generated fallbacks (always available)
2. **L1 (Static)** - Local assets from `/assets/packs/`
3. **L2 (GenAI)** - CDN URLs for AI-generated assets

See `docs/GENAI_ASSET_PROMPTS.md` for complete asset generation prompts.

---

## Balance System

The balance system is the **ONLY** system allowed to modify tuning values:

- Grip (physics friction)
- Traffic density
- Parking tolerance
- Scoring multiplier

All balance changes flow through:
```
Director → Balance System → Apply to Systems
```

**CI NEVER modifies game config automatically** - it only generates reports for human review.

---

## Branch Model

- **master** - Production deploy (always deployable)
- **develop** - Integration + experiments (no deploy)
- **feature/*** - Experimental work (no deploy, optional CI)

---

## Contributing

1. Follow the system isolation rules
2. Maintain determinism (seed everything)
3. Add tests for new systems
4. Run `npm run validate` before committing
5. Ensure all tests pass

---

## License

MIT

---

## Architecture Philosophy

This is not just a game. It's a **self-testing, seed-space fuzzed, deterministic procedural game production system** with:

- ✔ Deterministic gameplay
- ✔ Reproducible replays
- ✔ Single-file deployment
- ✔ Modular system architecture
- ✔ Runtime GenAI asset injection
- ✔ Automated deployment pipeline
- ✔ CI-enforced correctness guarantees
- ✔ Human-reviewed balance intelligence

Built for **long-term maintainability** and **procedural content synthesis at scale**.
