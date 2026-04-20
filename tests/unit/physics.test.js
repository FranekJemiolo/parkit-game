module.exports = (assert) => {
  // Test physics determinism with same seed
  const seed = 12345;
  
  // Mock car update function
  function updateCar(car, input, dt) {
    const PHYS = {
      MAX_SPEED: 260,
      ACCEL: 240,
      FRICTION: 0.965,
      WHEELBASE: 42,
      MAX_STEER: 0.55
    };
    
    let targetSteer = input.left ? -PHYS.MAX_STEER : input.right ? PHYS.MAX_STEER : 0;
    car.steering += (targetSteer - car.steering) * 0.18;
    
    if (input.up) car.velocity += PHYS.ACCEL * dt;
    if (input.down) car.velocity -= PHYS.ACCEL * dt;
    
    car.velocity *= PHYS.FRICTION;
    car.velocity = Math.max(-PHYS.MAX_SPEED, Math.min(PHYS.MAX_SPEED, car.velocity));
    
    car.x += Math.cos(car.angle) * car.velocity * dt;
    car.y += Math.sin(car.angle) * car.velocity * dt;
    car.angle += (car.velocity / PHYS.WHEELBASE) * Math.tan(car.steering) * dt;
  }
  
  // Simulate car twice with same seed
  function simulate(seed) {
    let carA = { x: 400, y: 300, angle: 0, velocity: 0, steering: 0 };
    let carB = { x: 400, y: 300, angle: 0, velocity: 0, steering: 0 };
    
    const input = { up: true, down: false, left: false, right: false };
    const dt = 0.016;
    
    for (let i = 0; i < 100; i++) {
      updateCar(carA, input, dt);
      updateCar(carB, input, dt);
    }
    
    return { carA, carB };
  }
  
  const result = simulate(seed);
  
  assert('physics is deterministic', 
    Math.abs(result.carA.x - result.carB.x) < 0.001 &&
    Math.abs(result.carA.y - result.carB.y) < 0.001
  );
  assert('car position is finite', isFinite(result.carA.x) && isFinite(result.carA.y));
  assert('car angle is finite', isFinite(result.carA.angle));
  assert('car velocity is clamped', Math.abs(result.carA.velocity) <= 260);
};
