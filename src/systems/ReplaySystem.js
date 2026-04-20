import { createRNG } from '../core/utils.js';

export class ReplaySystem {
  constructor() {
    this.recording = false;
    this.replaying = false;
    this.inputs = [];
    this.startTime = 0;
    this.currentFrame = 0;
  }

  init(engine) {
    this.engine = engine;
  }

  startRecording() {
    this.recording = true;
    this.replaying = false;
    this.inputs = [];
    this.startTime = performance.now();
  }

  stopRecording() {
    this.recording = false;
    return this.getRecording();
  }

  recordInput(input) {
    if (!this.recording) return;
    
    const timestamp = performance.now() - this.startTime;
    this.inputs.push({
      timestamp,
      input: { ...input }
    });
  }

  getRecording() {
    return {
      seed: this.engine.seed,
      inputs: [...this.inputs],
      duration: performance.now() - this.startTime
    };
  }

  startReplay(recording) {
    this.replaying = true;
    this.recording = false;
    this.inputs = [...recording.inputs];
    this.startTime = performance.now();
    this.currentFrame = 0;
    
    // Set engine seed for determinism
    this.engine.seed = recording.seed;
    this.engine.rng = createRNG(recording.seed);
  }

  stopReplay() {
    this.replaying = false;
    this.inputs = [];
  }

  getCurrentInput(dt) {
    if (!this.replaying) return null;
    
    const currentTime = performance.now() - this.startTime;
    
    // Find input for current time
    while (this.currentFrame < this.inputs.length) {
      const frame = this.inputs[this.currentFrame];
      if (frame.timestamp <= currentTime) {
        this.currentFrame++;
        return frame.input;
      } else {
        break;
      }
    }
    
    // Return last known input
    if (this.currentFrame > 0) {
      return this.inputs[this.currentFrame - 1].input;
    }
    
    return { up: false, down: false, left: false, right: false, brake: false };
  }

  isReplaying() {
    return this.replaying;
  }

  isRecording() {
    return this.recording;
  }

  exportToJSON() {
    return JSON.stringify(this.getRecording());
  }

  importFromJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return data;
    } catch (e) {
      console.error('Failed to import replay:', e);
      return null;
    }
  }

  exportToSeed() {
    const recording = this.getRecording();
    // Compress to seed string for sharing
    return btoa(JSON.stringify(recording)).substring(0, 32);
  }
}
