module.exports = async (assert) => {
  // Test full simulation determinism
  function createRNG(seed) {
    return function() {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t ^= t + Math.imul(t ^ seed >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  
  function simulateFullGame(seed) {
    const rng = createRNG(seed);
    
    // Simulate game state
    let car = { x: 400, y: 300, angle: 0, velocity: 0, steering: 0 };
    let fuel = 130;
    let moves = 0;
    let score = 0;
    
    const PHYS = {
      MAX_SPEED: 260,
      ACCEL: 240,
      FRICTION: 0.965,
      WHEELBASE: 42,
      MAX_STEER: 0.55
    };
    
    // Simulate 1000 frames
    for (let i = 0; i < 1000; i++) {
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
    }
    
    score = 100 - moves * 2 - (130 - fuel) * 1.2;
    
    return {
      car,
      fuel,
      moves,
      score,
      completed: fuel > 0
    };
  }
  
  const seed = 999;
  const runA = simulateFullGame(seed);
  const runB = simulateFullGame(seed);
  
  assert('full run is deterministic - car x', 
    Math.abs(runA.car.x - runB.car.x) < 0.001
  );
  assert('full run is deterministic - car y',
    Math.abs(runA.car.y - runB.car.y) < 0.001
  );
  assert('full run is deterministic - fuel',
    Math.abs(runA.fuel - runB.fuel) < 0.001
  );
  assert('full run is deterministic - moves',
    runA.moves === runB.moves
  );
  assert('full run is deterministic - score',
    Math.abs(runA.score - runB.score) < 0.001
  );
  assert('simulation produces valid car state', isFinite(runA.car.x) && isFinite(runA.car.y));
  assert('simulation produces valid score', isFinite(runA.score));
};
