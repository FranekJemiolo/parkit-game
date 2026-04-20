import { createRNG } from './utils.js';

export class Engine {
  constructor(config = {}) {
    this.systems = [];
    this.config = config;
    this.running = false;
    this.lastTime = 0;
    this.seed = config.seed || Date.now();
    this.rng = null;
  }

  registerSystem(system) {
    this.systems.push(system);
    return this;
  }

  init() {
    this.rng = createRNG(this.seed);
    
    // Initialize all systems
    for (const system of this.systems) {
      if (system.init) {
        system.init(this);
      }
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;

    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Update all systems
    for (const system of this.systems) {
      if (system.update) {
        system.update(dt);
      }
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  getSystem(name) {
    return this.systems.find(s => s.constructor.name === name);
  }
}
