export class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.sounds = new Map();
    this.musicVolume = 0.5;
    this.sfxVolume = 0.7;
    this.enabled = true;
  }

  init(engine) {
    this.engine = engine;
    this.initializeAudioContext();
    this.initializeProceduralSounds();
  }

  initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }

  initializeProceduralSounds() {
    // Create procedural sounds using oscillators
    this.sounds.set('engine', () => this.createEngineSound());
    this.sounds.set('brake', () => this.createBrakeSound());
    this.sounds.set('success', () => this.createSuccessSound());
    this.sounds.set('fail', () => this.createFailSound());
  }

  createEngineSound() {
    if (!this.audioContext || !this.enabled) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.1 * this.sfxVolume, this.audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    return { oscillator, gainNode };
  }

  createBrakeSound() {
    if (!this.audioContext || !this.enabled) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0.2 * this.sfxVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  createSuccessSound() {
    if (!this.audioContext || !this.enabled) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(554, this.audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(659, this.audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  createFailSound() {
    if (!this.audioContext || !this.enabled) return null;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3 * this.sfxVolume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.5);
  }

  playSound(name) {
    if (!this.enabled) return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      sound();
    }
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  toggleEnabled() {
    this.enabled = !this.enabled;
    if (!this.enabled && this.audioContext) {
      this.audioContext.suspend();
    } else if (this.enabled && this.audioContext) {
      this.audioContext.resume();
    }
  }
}
