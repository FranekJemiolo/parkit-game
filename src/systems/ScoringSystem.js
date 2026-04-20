import { SCORING, FUEL } from '../config/constants.js';

export class ScoringSystem {
  constructor() {
    this.moves = 0;
    this.fuel = FUEL.BASE;
    this.maxFuel = FUEL.BASE;
    this.globalMultiplier = 1.0;
    this.drivetrainMultiplier = 1.0;
  }

  init(engine) {
    this.engine = engine;
  }

  reset(maxFuel = FUEL.BASE) {
    this.moves = 0;
    this.fuel = maxFuel;
    this.maxFuel = maxFuel;
  }

  incrementMove() {
    this.moves++;
  }

  updateFuel(car, input, dt) {
    const speedCost = Math.abs(car.velocity) * FUEL.MOVE_FACTOR * dt;
    const steerCost = Math.abs(car.steering) * FUEL.STEER_FACTOR * dt;
    
    let reverseCost = 0;
    if (car.velocity < 0) {
      reverseCost = speedCost * (FUEL.REVERSE_MULTIPLIER - 1);
    }

    this.fuel = Math.max(0, this.fuel - (speedCost + steerCost + reverseCost));
  }

  setDrivetrainMultiplier(drivetrain) {
    // Different drivetrains have different scoring multipliers
    switch (drivetrain) {
      case 'RWD':
        this.drivetrainMultiplier = 1.2; // Harder = higher score potential
        break;
      case 'AWD':
        this.drivetrainMultiplier = 1.0;
        break;
      case 'FWD':
      default:
        this.drivetrainMultiplier = 1.1;
        break;
    }
  }

  setGlobalMultiplier(multiplier) {
    this.globalMultiplier = multiplier;
  }

  computeFinalScore(parkingEvaluation, time) {
    // Simplified scoring: just parking quality + small time bonus
    const baseScore = parkingEvaluation.total * this.drivetrainMultiplier;
    const timeBonus = Math.max(0, 50 - time); // Small time bonus
    
    const finalScore = (baseScore + timeBonus) * this.globalMultiplier;

    return {
      final: Math.max(0, finalScore),
      breakdown: {
        base: baseScore,
        timeBonus,
        moves: this.moves,
        fuelRemaining: this.fuel,
        parkingQuality: parkingEvaluation.total
      }
    };
  }

  getStats() {
    return {
      moves: this.moves,
      fuel: this.fuel,
      maxFuel: this.maxFuel
    };
  }
}
