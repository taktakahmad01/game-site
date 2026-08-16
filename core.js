// Game Site - Core

const GameApp = {
  version: "1.0.0",
  ready: false,

  init() {
    this.ready = true;
    console.log("🎮 Game Site is ready!");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  GameApp.init();
});
