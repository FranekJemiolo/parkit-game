import { SEASONS } from '../config/constants.js';

export class SeasonSystem {
  constructor() {
    this.currentSeason = SEASONS.SUMMER;
    this.modifiers = {
      grip: 1.0,
      visibility: 1.0,
      trafficDensity: 1.0
    };
  }

  init(engine) {
    this.engine = engine;
    this.setSeasonFromDate();
  }

  setSeason(season) {
    this.currentSeason = season;
    this.applySeasonModifiers();
  }

  setSeasonFromDate() {
    const month = new Date().getMonth() + 1;
    
    if (month >= 12 || month <= 2) {
      this.setSeason(SEASONS.WINTER);
    } else if (month >= 6 && month <= 8) {
      this.setSeason(SEASONS.SUMMER);
    } else {
      this.setSeason(SEASONS.RAIN);
    }
  }

  applySeasonModifiers() {
    switch (this.currentSeason) {
      case SEASONS.WINTER:
        this.modifiers = {
          grip: 0.6,      // Icy roads
          visibility: 0.9,
          trafficDensity: 0.8
        };
        break;
      case SEASONS.RAIN:
        this.modifiers = {
          grip: 0.8,      // Wet roads
          visibility: 0.85,
          trafficDensity: 1.0
        };
        break;
      case SEASONS.SUMMER:
      default:
        this.modifiers = {
          grip: 1.0,      // Dry roads
          visibility: 1.0,
          trafficDensity: 1.2
        };
        break;
    }
  }

  getModifiers() {
    return { ...this.modifiers };
  }

  getCurrentSeason() {
    return this.currentSeason;
  }
}
