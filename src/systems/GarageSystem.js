import { DRIVETRAIN } from '../config/constants.js';

export class GarageSystem {
  constructor() {
    this.unlockedCars = [DRIVETRAIN.FWD];
    this.currentCar = DRIVETRAIN.FWD;
    this.bestScores = {};
    this.totalRuns = 0;
  }

  init(engine) {
    this.engine = engine;
    this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('parkit_garage');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedCars = data.unlockedCars || [DRIVETRAIN.FWD];
        this.currentCar = data.currentCar || DRIVETRAIN.FWD;
        this.bestScores = data.bestScores || {};
        this.totalRuns = data.totalRuns || 0;
      }
    } catch (e) {
      console.warn('Failed to load garage progress:', e);
    }
  }

  saveProgress() {
    try {
      const data = {
        unlockedCars: this.unlockedCars,
        currentCar: this.currentCar,
        bestScores: this.bestScores,
        totalRuns: this.totalRuns
      };
      localStorage.setItem('parkit_garage', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save garage progress:', e);
    }
  }

  unlockCar(drivetrain) {
    if (!this.unlockedCars.includes(drivetrain)) {
      this.unlockedCars.push(drivetrain);
      this.saveProgress();
    }
  }

  setCurrentCar(drivetrain) {
    if (this.unlockedCars.includes(drivetrain)) {
      this.currentCar = drivetrain;
      this.saveProgress();
    }
  }

  getCurrentCar() {
    return this.currentCar;
  }

  getUnlockedCars() {
    return [...this.unlockedCars];
  }

  recordScore(seed, score) {
    if (!this.bestScores[seed] || score > this.bestScores[seed]) {
      this.bestScores[seed] = score;
    }
    this.totalRuns++;
    this.saveProgress();
  }

  getBestScore(seed) {
    return this.bestScores[seed] || 0;
  }

  getTotalRuns() {
    return this.totalRuns;
  }

  reset() {
    this.unlockedCars = [DRIVETRAIN.FWD];
    this.currentCar = DRIVETRAIN.FWD;
    this.bestScores = {};
    this.totalRuns = 0;
    this.saveProgress();
  }
}
