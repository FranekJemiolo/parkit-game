module.exports = (assert) => {
  // Test director selection stability
  const personalities = ['flow', 'chaos', 'teacher', 'rival'];
  
  // Mock director system
  class MockDirector {
    constructor() {
      this.current = 'flow';
      this.history = [];
    }
    
    select(rng) {
      const recent = this.history.slice(-3);
      const available = personalities.filter(p => !recent.includes(p));
      this.current = available[Math.floor(rng() * available.length)];
      this.history.push(this.current);
    }
    
    getModifiers() {
      switch (this.current) {
        case 'flow': return { grip: 1.0, traffic: 0.8, tolerance: 1.1 };
        case 'chaos': return { grip: 0.85, traffic: 1.5, tolerance: 0.9 };
        case 'teacher': return { grip: 1.1, traffic: 0.5, tolerance: 1.3 };
        case 'rival': return { grip: 0.9, traffic: 1.2, tolerance: 0.85 };
        default: return { grip: 1.0, traffic: 1.0, tolerance: 1.0 };
      }
    }
  }
  
  // Simple RNG for testing
  function createRNG(seed) {
    return function() {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t ^= t + Math.imul(t ^ seed >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  
  const director1 = new MockDirector();
  const director2 = new MockDirector();
  
  const rng1 = createRNG(123);
  const rng2 = createRNG(123);
  
  director1.select(rng1);
  director2.select(rng2);
  
  assert('director selection is deterministic with same seed', 
    director1.current === director2.current
  );
  
  const mods1 = director1.getModifiers();
  const mods2 = director2.getModifiers();
  
  assert('director modifiers are valid', mods1.grip > 0 && mods1.traffic > 0);
  assert('director modifiers are finite', isFinite(mods1.grip) && isFinite(mods1.traffic));
};
