export class InputSystem {
  constructor() {
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      brake: false
    };
    this.lastInput = { ...this.input };
  }

  init(engine) {
    this.engine = engine;
    this.bindInput();
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.input.up = true;
      if (e.key === 'ArrowDown' || e.key === 's') this.input.down = true;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = true;
      if (e.key === 'Shift') this.input.brake = true;
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') this.input.up = false;
      if (e.key === 'ArrowDown' || e.key === 's') this.input.down = false;
      if (e.key === 'ArrowLeft' || e.key === 'a') this.input.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd') this.input.right = false;
      if (e.key === 'Shift') this.input.brake = false;
    });
  }

  update(dt) {
    // Input state is updated by event listeners
  }

  hasChanged() {
    return (
      this.input.up !== this.lastInput.up ||
      this.input.down !== this.lastInput.down ||
      this.input.left !== this.lastInput.left ||
      this.input.right !== this.lastInput.right ||
      this.input.brake !== this.lastInput.brake
    );
  }

  snapshot() {
    this.lastInput = { ...this.input };
  }

  getInput() {
    return { ...this.input };
  }
}
