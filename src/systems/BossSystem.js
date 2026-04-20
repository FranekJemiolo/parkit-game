export class BossSystem {
  constructor() {
    this.activeBoss = null;
    this.bossTimer = 0;
    this.obstacles = [];
  }

  init(engine) {
    this.engine = engine;
  }

  activateBoss(bossConfig) {
    if (!bossConfig) return;
    
    this.activeBoss = {
      type: bossConfig.type,
      name: bossConfig.name,
      intensity: bossConfig.intensity,
      phase: 0
    };
    
    this.bossTimer = 0;
    this.obstacles = [];
  }

  update(dt) {
    if (!this.activeBoss) return;
    
    this.bossTimer += dt;
    
    switch (this.activeBoss.type) {
      case 'moving_zone':
        this.updateMovingZone(dt);
        break;
      case 'obstacle_swarm':
        this.updateObstacleSwarm(dt);
        break;
      case 'time_pressure':
        this.updateTimePressure(dt);
        break;
    }
  }

  updateMovingZone(dt) {
    // Parking spot shifts position periodically
    const period = 5 - (this.activeBoss.intensity * 2);
    const phase = (this.bossTimer % period) / period;
    
    // Shift parking spot based on phase
    const parking = this.engine.getSystem('ParkingSystem');
    if (parking && parking.getParkingSpot()) {
      const spot = parking.getParkingSpot();
      const shift = Math.sin(phase * Math.PI * 2) * 20 * this.activeBoss.intensity;
      // This would modify the parking spot position
    }
  }

  updateObstacleSwarm(dt) {
    // Spawn moving obstacles periodically
    const spawnInterval = 2 - this.activeBoss.intensity;
    
    if (this.bossTimer % spawnInterval < dt) {
      this.spawnSwarmObstacle();
    }
    
    // Update obstacle positions
    this.obstacles = this.obstacles.filter(obs => {
      obs.x += obs.vx * dt;
      obs.y += obs.vy * dt;
      obs.life -= dt;
      return obs.life > 0;
    });
  }

  spawnSwarmObstacle() {
    const rng = this.engine.rng;
    const parking = this.engine.getSystem('ParkingSystem');
    const spot = parking ? parking.getParkingSpot() : { x: 400, y: 300 };
    
    this.obstacles.push({
      x: spot.x + (rng() - 0.5) * 200,
      y: spot.y + (rng() - 0.5) * 200,
      w: 20,
      h: 20,
      vx: (rng() - 0.5) * 50 * this.activeBoss.intensity,
      vy: (rng() - 0.5) * 50 * this.activeBoss.intensity,
      life: 3
    });
  }

  updateTimePressure(dt) {
    // Time-based scoring penalty increases
    const scoring = this.engine.getSystem('ScoringSystem');
    if (scoring) {
      // Apply time pressure modifier
    }
  }

  getObstacles() {
    return this.obstacles;
  }

  getActiveBoss() {
    return this.activeBoss;
  }

  deactivate() {
    this.activeBoss = null;
    this.obstacles = [];
    this.bossTimer = 0;
  }
}
