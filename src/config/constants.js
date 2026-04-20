export const PHYSICS = {
  MAX_SPEED: 1200,
  ACCEL: 1600,
  BRAKE: 1000,
  FRICTION: 0.985,
  WHEELBASE: 35,
  MAX_STEER: 0.8
};

export const FUEL = {
  BASE: 130,
  DIFFICULTY_BONUS: 90,
  MOVE_FACTOR: 0.08,
  STEER_FACTOR: 0.03,
  REVERSE_MULTIPLIER: 1.45,
  HARD_FAIL: false
};

export const SCORING = {
  POSITION_WEIGHT: 0.6,
  ANGLE_WEIGHT: 0.4,
  POS_K: 2.0,
  ANGLE_K: 3.0
};

export const GAME = {
  LEVELS_TO_MAX_DIFFICULTY: 20,
  MOVE_THRESHOLD_STEER: 0.35,
  MOVE_THRESHOLD_THROTTLE: 0.2,
  FPS: 60
};

export const CAR = {
  WIDTH: 25,
  LENGTH: 50,
  SAFE_MARGIN: 5
};

export const DRIVETRAIN = {
  FWD: 'FWD',
  RWD: 'RWD',
  AWD: 'AWD'
};

export const SEASONS = {
  SUMMER: 'summer',
  WINTER: 'winter',
  RAIN: 'rain'
};

export const DIRECTOR_PERSONALITIES = {
  FLOW: 'flow',
  CHAOS: 'chaos',
  TEACHER: 'teacher',
  RIVAL: 'rival'
};
