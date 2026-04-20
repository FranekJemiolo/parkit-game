import { PHYSICS, DRIVETRAIN } from '../config/constants.js';
import { clamp } from '../core/utils.js';

export class CarPhysicsSystem {
  constructor() {
    this.car = null;
    this.drivetrain = DRIVETRAIN.FWD;
    this.balanceModifiers = {
      grip: 1.0,
      maxSpeed: 1.0
    };
    this.wheelSteeringAngle = 0; // Wheel steering angle from visual wheels
  }

  init(engine) {
    this.engine = engine;
    this.resetCar();
  }

  resetCar(startPose = { x: 400, y: 300, angle: 0 }) {
    this.car = {
      x: startPose.x,
      y: startPose.y,
      angle: startPose.angle,
      velocity: 0,
      steering: 0,
      angularVelocity: 0
    };
  }
  
  setWheelSteeringAngle(angle) {
    this.wheelSteeringAngle = angle;
  }

  setDrivetrain(drivetrain) {
    this.drivetrain = drivetrain;
  }

  applyBalanceModifiers(modifiers) {
    if (modifiers.grip !== undefined) {
      this.balanceModifiers.grip = modifiers.grip;
    }
    if (modifiers.maxSpeed !== undefined) {
      this.balanceModifiers.maxSpeed = modifiers.maxSpeed;
    }
  }

  update(dt, input) {
    if (!this.car) return;

    const effectiveMaxSpeed = PHYSICS.MAX_SPEED * this.balanceModifiers.maxSpeed;
    const effectiveFriction = PHYSICS.FRICTION * this.balanceModifiers.grip;

    // Use wheel steering angle for movement (from visual wheels)
    // Don't calculate internal steering - use the wheel angle directly
    this.car.steering = this.wheelSteeringAngle;

    // Acceleration based on drivetrain
    let accelMultiplier = 1.0;
    if (this.drivetrain === DRIVETRAIN.RWD) {
      // RWD: more aggressive acceleration, harder to control
      accelMultiplier = 1.1;
    } else if (this.drivetrain === DRIVETRAIN.AWD) {
      // AWD: more stable, consistent acceleration
      accelMultiplier = 0.95;
    }

    if (input.up) this.car.velocity += PHYSICS.ACCEL * accelMultiplier * dt;
    if (input.down) this.car.velocity -= PHYSICS.BRAKE * dt;
    if (input.brake) this.car.velocity *= 0.9;

    // Friction
    this.car.velocity *= effectiveFriction;
    this.car.velocity = clamp(this.car.velocity, -effectiveMaxSpeed, effectiveMaxSpeed);

    // Movement
    this.car.x += Math.cos(this.car.angle) * this.car.velocity * dt;
    this.car.y += Math.sin(this.car.angle) * this.car.velocity * dt;

    // Rotation using wheel steering angle (bicycle model)
    let turnMultiplier = 1.0;
    if (this.drivetrain === DRIVETRAIN.FWD) {
      // FWD: more responsive steering at low speeds
      turnMultiplier = 1.1;
    } else if (this.drivetrain === DRIVETRAIN.RWD) {
      // RWD: more oversteer tendency
      turnMultiplier = 1.15;
    } else if (this.drivetrain === DRIVETRAIN.AWD) {
      // AWD: more stable turning
      turnMultiplier = 1.0;
    }

    this.car.angle += (this.car.velocity / PHYSICS.WHEELBASE) * 
                     Math.tan(this.car.steering) * turnMultiplier * dt;
  }

  getCarState() {
    return { ...this.car };
  }

  setCarState(state) {
    this.car = { ...state };
  }
}
