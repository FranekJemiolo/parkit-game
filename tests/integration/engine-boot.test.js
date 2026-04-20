module.exports = (assert) => {
  // Test engine can be instantiated and initialized
  class MockEngine {
    constructor(config) {
      this.systems = [];
      this.config = config;
      this.seed = config.seed || Date.now();
    }
    
    registerSystem(system) {
      this.systems.push(system);
      return this;
    }
    
    init() {
      for (const system of this.systems) {
        if (system.init) {
          system.init(this);
        }
      }
    }
  }
  
  class MockSystem {
    init(engine) {
      this.engine = engine;
    }
  }
  
  const engine = new MockEngine({ seed: 12345 });
  
  engine
    .registerSystem(new MockSystem())
    .registerSystem(new MockSystem())
    .registerSystem(new MockSystem());
  
  engine.init();
  
  assert('engine has systems registered', engine.systems.length === 3);
  assert('engine has seed set', engine.seed === 12345);
  assert('systems have engine reference', engine.systems[0].engine === engine);
};
