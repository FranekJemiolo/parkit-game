import { SCORING, CAR } from '../config/constants.js';
import { dist, angleDiff } from '../core/utils.js';

export class ParkingSystem {
  constructor() {
    this.parkingSpot = null;
    this.toleranceMultiplier = 1.0;
  }

  init(engine) {
    this.engine = engine;
  }

  setParkingSpot(spot) {
    this.parkingSpot = spot;
  }

  setTolerance(multiplier) {
    this.toleranceMultiplier = multiplier;
  }

  evaluateParking(car) {
    if (!this.parkingSpot) return null;

    const dx = car.x - this.parkingSpot.x;
    const dy = car.y - this.parkingSpot.y;
    const posError = Math.sqrt(dx * dx + dy * dy);
    const angleError = angleDiff(car.angle, this.parkingSpot.angle);

    const effectivePosK = SCORING.POS_K / this.toleranceMultiplier;
    const effectiveAngK = SCORING.ANGLE_K / this.toleranceMultiplier;

    const positionScore = Math.max(0, 100 - posError * effectivePosK);
    const angleScore = Math.max(0, 100 - angleError * effectiveAngK);

    const total = positionScore * SCORING.POSITION_WEIGHT + 
                  angleScore * SCORING.ANGLE_WEIGHT;

    return {
      positionScore,
      angleScore,
      total,
      posError,
      angleError
    };
  }

  checkWin(car, evaluation) {
    if (!evaluation) return false;

    const posThreshold = (CAR.LENGTH / 2) * this.toleranceMultiplier;
    const angleThreshold = 0.2 * this.toleranceMultiplier;

    return (
      evaluation.posError < posThreshold &&
      evaluation.angleError < angleThreshold &&
      Math.abs(car.velocity) < 20
    );
  }

  getParkingSpot() {
    return this.parkingSpot;
  }
}
