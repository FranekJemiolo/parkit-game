export class BalanceSystem {
  constructor() {
    this.tuning = {
      grip: 1.0,
      trafficDensity: 1.0,
      parkingTolerance: 1.0,
      scoringMultiplier: 1.0
    };
  }

  init(engine) {
    this.engine = engine;
  }

  applyDirectorModifiers(modifiers) {
    // ONLY system allowed to modify tuning values
    this.tuning.grip = modifiers.gripMultiplier;
    this.tuning.trafficDensity = modifiers.trafficMultiplier;
    this.tuning.parkingTolerance = modifiers.toleranceMultiplier;
  }

  applySeasonModifiers(modifiers) {
    // Season modifiers affect grip and traffic
    this.tuning.grip *= modifiers.grip;
    this.tuning.trafficDensity *= modifiers.trafficDensity;
  }

  applyTuning() {
    // Apply tuning to relevant systems
    const physics = this.engine.getSystem('CarPhysicsSystem');
    if (physics) {
      physics.applyBalanceModifiers({
        grip: this.tuning.grip,
        maxSpeed: 1.0 // Could be modified by balance patches
      });
    }

    const parking = this.engine.getSystem('ParkingSystem');
    if (parking) {
      parking.setTolerance(this.tuning.parkingTolerance);
    }

    const scoring = this.engine.getSystem('ScoringSystem');
    if (scoring) {
      scoring.setGlobalMultiplier(this.tuning.scoringMultiplier);
    }
  }

  setTuning(key, value) {
    if (this.tuning.hasOwnProperty(key)) {
      this.tuning[key] = value;
    }
  }

  getTuning() {
    return { ...this.tuning };
  }

  reset() {
    this.tuning = {
      grip: 1.0,
      trafficDensity: 1.0,
      parkingTolerance: 1.0,
      scoringMultiplier: 1.0
    };
  }
}
