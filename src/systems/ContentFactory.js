import { DRIVETRAIN } from '../config/constants.js';
import { lerp } from '../core/utils.js';

export class ContentFactory {
  constructor() {
    this.carPool = [];
    this.bossPool = [];
    this.modifierPool = [];
  }

  init(engine) {
    this.engine = engine;
    this.initializeContent();
  }

  initializeContent() {
    // Car pool definitions
    this.carPool = [
      { drivetrain: DRIVETRAIN.FWD, name: 'Compact', difficulty: 0.3 },
      { drivetrain: DRIVETRAIN.RWD, name: 'Sport', difficulty: 0.6 },
      { drivetrain: DRIVETRAIN.AWD, name: 'Rally', difficulty: 0.8 }
    ];

    // Boss pool definitions
    this.bossPool = [
      { type: 'moving_zone', name: 'Shifting Spot', difficulty: 0.5 },
      { type: 'obstacle_swarm', name: 'Cone Chaos', difficulty: 0.7 },
      { type: 'time_pressure', name: 'Clockwork', difficulty: 0.6 }
    ];

    // Modifier pool
    this.modifierPool = [
      { type: 'fuel_scarcity', name: 'Low Fuel', effect: { fuelMultiplier: 0.7 } },
      { type: 'tight_turns', name: 'Sharp Turns', effect: { steerLimit: 0.8 } },
      { type: 'speed_limit', name: 'Speed Limit', effect: { maxSpeed: 0.8 } }
    ];
  }

  generateCar(difficulty) {
    const rng = this.engine.rng;
    
    // Select car based on difficulty
    const availableCars = this.carPool.filter(c => c.difficulty <= difficulty + 0.2);
    const car = availableCars[Math.floor(rng() * availableCars.length)];
    
    return {
      drivetrain: car.drivetrain,
      name: car.name,
      baseDifficulty: car.difficulty
    };
  }

  generateBoss(difficulty) {
    const rng = this.engine.rng;
    
    // Only spawn boss at higher difficulties
    if (difficulty < 0.4) return null;
    
    const availableBosses = this.bossPool.filter(b => b.difficulty <= difficulty);
    const boss = availableBosses[Math.floor(rng() * availableBosses.length)];
    
    return {
      type: boss.type,
      name: boss.name,
      intensity: lerp(0.5, 1.0, difficulty)
    };
  }

  generateModifiers(difficulty) {
    const rng = this.engine.rng;
    const modifiers = [];
    
    // Number of modifiers increases with difficulty
    const count = Math.floor(difficulty * 3);
    
    for (let i = 0; i < count; i++) {
      const mod = this.modifierPool[Math.floor(rng() * this.modifierPool.length)];
      modifiers.push({
        type: mod.type,
        name: mod.name,
        effect: { ...mod.effect }
      });
    }
    
    return modifiers;
  }

  generateLevel(difficulty) {
    return {
      car: this.generateCar(difficulty),
      boss: this.generateBoss(difficulty),
      modifiers: this.generateModifiers(difficulty)
    };
  }
}
