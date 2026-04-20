function createRNG(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ seed >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function runSimulation(seed) {
  const rng = createRNG(seed);
  
  // Simulate game state
  let car = { x: 400, y: 300, angle: 0, velocity: 0, steering: 0 };
  let fuel = 130;
  let moves = 0;
  let score = 0;
  let directorPersonality = 'flow';
  let directorHistory = [];
  
  const PHYS = {
    MAX_SPEED: 260,
    ACCEL: 240,
    FRICTION: 0.965,
    WHEELBASE: 42,
    MAX_STEER: 0.55
  };
  
  const maxSteps = 500;
  const log = [];
  
  // Simulate game loop
  for (let i = 0; i < maxSteps; i++) {
    // Random input
    const input = {
      up: rng() > 0.5,
      down: rng() > 0.8,
      left: rng() > 0.7,
      right: rng() > 0.7
    };
    
    // Update car
    let targetSteer = input.left ? -PHYS.MAX_STEER : input.right ? PHYS.MAX_STEER : 0;
    car.steering += (targetSteer - car.steering) * 0.18;
    
    if (input.up) car.velocity += PHYS.ACCEL * 0.016;
    if (input.down) car.velocity -= PHYS.ACCEL * 0.016;
    
    car.velocity *= PHYS.FRICTION;
    car.velocity = Math.max(-PHYS.MAX_SPEED, Math.min(PHYS.MAX_SPEED, car.velocity));
    
    car.x += Math.cos(car.angle) * car.velocity * 0.016;
    car.y += Math.sin(car.angle) * car.velocity * 0.016;
    car.angle += (car.velocity / PHYS.WHEELBASE) * Math.tan(car.steering) * 0.016;
    
    // Update fuel
    fuel -= Math.abs(car.velocity) * 0.08 * 0.016;
    fuel = Math.max(0, fuel);
    
    // Track moves
    if (input.up || input.down || input.left || input.right) {
      moves++;
    }
    
    // Director simulation (occasionally switch)
    if (i % 50 === 0 && rng() > 0.8) {
      directorHistory.push(directorPersonality);
      const personalities = ['flow', 'chaos', 'teacher', 'rival'];
      directorPersonality = personalities[Math.floor(rng() * personalities.length)];
    }
    
    // Log state periodically
    if (i % 10 === 0) {
      log.push({
        step: i,
        car: { ...car },
        fuel,
        moves,
        director: directorPersonality
      });
    }
    
    // Stop if fuel runs out
    if (fuel <= 0) break;
  }
  
  score = 100 - moves * 2 - (130 - fuel) * 1.2;
  
  return {
    seed,
    log,
    final: {
      car,
      fuel,
      moves,
      score,
      director: directorPersonality,
      completed: fuel > 0
    }
  };
}

module.exports = { runSimulation };
