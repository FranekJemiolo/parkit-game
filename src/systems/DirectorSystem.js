import { DIRECTOR_PERSONALITIES } from '../config/constants.js';

export class DirectorSystem {
  constructor() {
    this.currentPersonality = DIRECTOR_PERSONALITIES.FLOW;
    this.personalityHistory = [];
    this.stability = 1.0;
    this.switchThreshold = 0.1;
  }

  init(engine) {
    this.engine = engine;
    this.selectPersonality();
  }

  selectPersonality(forced = null) {
    if (forced) {
      this.currentPersonality = forced;
    } else {
      // Weighted random selection based on history
      const personalities = Object.values(DIRECTOR_PERSONALITIES);
      
      // Avoid repeating the same personality too often
      const recent = this.personalityHistory.slice(-3);
      const available = personalities.filter(p => !recent.includes(p));
      
      const rng = this.engine.rng;
      const index = Math.floor(rng() * available.length);
      this.currentPersonality = available[index];
    }

    this.personalityHistory.push(this.currentPersonality);
    if (this.personalityHistory.length > 10) {
      this.personalityHistory.shift();
    }
  }

  getModifiers() {
    switch (this.currentPersonality) {
      case DIRECTOR_PERSONALITIES.FLOW:
        return {
          gripMultiplier: 1.0,
          trafficMultiplier: 0.8,
          toleranceMultiplier: 1.1,
          description: 'Stable, forgiving gameplay'
        };

      case DIRECTOR_PERSONALITIES.CHAOS:
        return {
          gripMultiplier: 0.85,
          trafficMultiplier: 1.5,
          toleranceMultiplier: 0.9,
          description: 'High variance, unpredictable'
        };

      case DIRECTOR_PERSONALITIES.TEACHER:
        return {
          gripMultiplier: 1.1,
          trafficMultiplier: 0.5,
          toleranceMultiplier: 1.3,
          description: 'Forgiving learning environment'
        };

      case DIRECTOR_PERSONALITIES.RIVAL:
        return {
          gripMultiplier: 0.9,
          trafficMultiplier: 1.2,
          toleranceMultiplier: 0.85,
          description: 'Competitive pressure'
        };

      default:
        return {
          gripMultiplier: 1.0,
          trafficMultiplier: 1.0,
          toleranceMultiplier: 1.0,
          description: 'Standard gameplay'
        };
    }
  }

  updateBasedOnPerformance(successRate) {
    // Director can switch personalities based on player performance
    if (successRate > 0.8 && Math.random() < this.switchThreshold) {
      // Player doing well, increase challenge
      if (this.currentPersonality === DIRECTOR_PERSONALITIES.TEACHER) {
        this.selectPersonality(DIRECTOR_PERSONALITIES.FLOW);
      } else if (this.currentPersonality === DIRECTOR_PERSONALITIES.FLOW) {
        this.selectPersonality(DIRECTOR_PERSONALITIES.RIVAL);
      }
    } else if (successRate < 0.3 && Math.random() < this.switchThreshold) {
      // Player struggling, be more forgiving
      if (this.currentPersonality === DIRECTOR_PERSONALITIES.CHAOS) {
        this.selectPersonality(DIRECTOR_PERSONALITIES.RIVAL);
      } else if (this.currentPersonality === DIRECTOR_PERSONALITIES.RIVAL) {
        this.selectPersonality(DIRECTOR_PERSONALITIES.FLOW);
      }
    }
  }

  getCurrentPersonality() {
    return this.currentPersonality;
  }

  setStability(value) {
    this.stability = value;
  }

  setSwitchThreshold(value) {
    this.switchThreshold = value;
  }
}
