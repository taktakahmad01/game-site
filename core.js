// Game Site - Core

const GameApp = {
  version: "1.0.0",
  ready: false,
  currentRoomCode: null,

  init() {
    this.ready = true;
    console.log("🎮 Game Site is ready!");

    const createBtn = document.getElementById("createGame");
    const joinBtn = document.getElementById("joinGame");
    const status = document.getElementById("status");

    if (createBtn) {
      createBtn.addEventListener("click", async () => {
        await this.createRoom(status);
      });
    }

    if (joinBtn) {
      joinBtn.addEventListener("click", () => {
        alert("Join by code is next.");
      });
    }
  },

  generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";

    for (let i = 0; i < 6; i++) {
      code += chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
    }

    return code;
  },

  async createRoom(statusElement) {
    try {
      if (statusElement) {
        statusElement.textContent = "Creating room...";
      }

      let roomCode = this.generateRoomCode();

      const roomRef = database.ref(
        "gameV2/rooms/" + roomCode
      );

      const existing = await roomRef.once("value");

      while (existing.exists()) {
        roomCode = this.generateRoomCode();
      }

      await database.ref(
        "gameV2/rooms/" + roomCode
      ).set({
        code: roomCode,
        status: "waiting",
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      this.currentRoomCode = roomCode;

      if (statusElement) {
        statusElement.textContent =
          "ROOM CODE: " + roomCode;
      }

      alert("Room created: " + roomCode);

      console.log("✅ Room created:", roomCode);

    } catch (error) {
      console.error("❌ Create room error:", error);

      if (statusElement) {
        statusElement.textContent =
          "Could not create room";
      }

      alert("Could not create room");
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  GameApp.init();
});
