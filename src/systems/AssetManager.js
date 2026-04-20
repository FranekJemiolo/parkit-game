export class AssetManager {
  constructor() {
    this.assets = new Map();
    this.loadedAssets = new Map();
    this.genaiUrls = {
      base: 'https://api.example.com/genai/assets'
    };
  }

  init(engine) {
    this.engine = engine;
    this.initializeProceduralAssets();
    this.preloadAssets(['bmw_m2_topdown', 'bmw_5_topdown']);
  }

  initializeProceduralAssets() {
    // L0: Procedural fallback assets (always available)
    this.assets.set('car_fwd', this.createProceduralCar('blue'));
    this.assets.set('car_rwd', this.createProceduralCar('red'));
    this.assets.set('car_awd', this.createProceduralCar('green'));
    this.assets.set('parking_spot', this.createProceduralParkingSpot());
    this.assets.set('cone', this.createProceduralCone());
    this.assets.set('barrier', this.createProceduralBarrier());
    this.assets.set('road_summer', this.createProceduralRoad('#3a3a3a'));
    this.assets.set('road_winter', this.createProceduralRoad('#5a6a7a'));
    this.assets.set('road_rain', this.createProceduralRoad('#2a2a35'));
  }

  createProceduralCar(color) {
    // Create a simple canvas-based car sprite
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    // Car body
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 40, 20);
    
    // Windows
    ctx.fillStyle = '#333';
    ctx.fillRect(8, 2, 12, 16);
    ctx.fillRect(22, 2, 10, 16);
    
    // Headlights
    ctx.fillStyle = '#ff0';
    ctx.fillRect(36, 2, 3, 4);
    ctx.fillRect(36, 14, 3, 4);
    
    // Taillights
    ctx.fillStyle = '#f00';
    ctx.fillRect(1, 2, 3, 4);
    ctx.fillRect(1, 14, 3, 4);
    
    return canvas.toDataURL();
  }

  createProceduralParkingSpot() {
    const canvas = document.createElement('canvas');
    canvas.width = 60;
    canvas.height = 30;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, 60, 30);
    
    // Lines
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, 56, 26);
    
    return canvas.toDataURL();
  }

  createProceduralCone() {
    const canvas = document.createElement('canvas');
    canvas.width = 20;
    canvas.height = 20;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(18, 18);
    ctx.lineTo(2, 18);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(6, 10, 8, 3);
    
    return canvas.toDataURL();
  }

  createProceduralBarrier() {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 15;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#666';
    ctx.fillRect(0, 0, 40, 15);
    
    // Stripes
    ctx.fillStyle = '#f00';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(i * 10, 0, 5, 15);
    }
    
    return canvas.toDataURL();
  }

  createProceduralRoad(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 100, 100);
    
    // Add subtle texture
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(Math.random() * 100, Math.random() * 100, 2, 2);
    }
    
    return canvas.toDataURL();
  }

  async loadAsset(key) {
    // Check if already loaded
    if (this.loadedAssets.has(key)) {
      return this.loadedAssets.get(key);
    }
    
    // Try L1: Static assets from /assets/packs/
    try {
      const staticPath = `/assets/packs/${key}.png`;
      const response = await fetch(staticPath);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        this.loadedAssets.set(key, url);
        return url;
      }
    } catch (e) {
      console.warn(`Failed to load static asset: ${key}`);
    }
    
    // Try L2: GenAI CDN URLs
    try {
      const genaiPath = `${this.genaiUrls.base}/${key}.png`;
      const response = await fetch(genaiPath);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        this.loadedAssets.set(key, url);
        return url;
      }
    } catch (e) {
      console.warn(`Failed to load GenAI asset: ${key}`);
    }
    
    // Fallback to L0: Procedural
    if (this.assets.has(key)) {
      this.loadedAssets.set(key, this.assets.get(key));
      return this.assets.get(key);
    }
    
    // Ultimate fallback
    return null;
  }

  preloadAssets(keys) {
    return Promise.all(keys.map(key => this.loadAsset(key)));
  }

  getAsset(key) {
    return this.loadedAssets.get(key) || this.assets.get(key);
  }

  setGenaiBaseUrl(url) {
    this.genaiUrls.base = url;
  }
}
