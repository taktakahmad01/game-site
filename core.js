// Game Site - Core

const GameApp = {
  version: "1.0.1",
  ready: false,
  currentRoomCode: null,

  init() {
    this.ready = true;

    const createBtn = document.getElementById("createGame");
    const joinBtn = document.getElementById("joinGame");
    const status = document.getElementById("status");

    if (createBtn) {
      createBtn.addEventListener("click", async () => {
        await this.createRoom(status);
      });
    }

    if (joinBtn) {
      joinBtn.addEventListener("click", async () => {
        await this.askAndJoinRoom(status);
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

  async createUniqueRoomCode() {
    while (true) {
      const code = this.generateRoomCode();

      const snap = await database
        .ref("gameV2/rooms/" + code)
        .once("value");

      if (!snap.exists()) {
        return code;
      }
    }
  },

  async createRoom(statusElement) {
    try {
      if (statusElement) {
        statusElement.textContent = "Creating room...";
      }

      const roomCode = await this.createUniqueRoomCode();

      await database
        .ref("gameV2/rooms/" + roomCode)
        .set({
          code: roomCode,
          status: "waiting",
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          playerCount: 1
        });

      this.currentRoomCode = roomCode;

      if (statusElement) {
        statusElement.textContent =
          "ROOM CODE: " + roomCode;
      }

      alert("Room created: " + roomCode);

    } catch (error) {
      console.error(error);

      if (statusElement) {
        statusElement.textContent =
          "Could not create room";
      }

      alert("Could not create room");
    }
  },

  async askAndJoinRoom(statusElement) {
    const enteredCode = prompt(
      "Enter room code:"
    );

    if (!enteredCode) {
      return;
    }

    const roomCode =
      enteredCode.trim().toUpperCase();

    await this.joinRoom(
      roomCode,
      statusElement
    );
  },

  async joinRoom(roomCode, statusElement) {
    try {
      if (statusElement) {
        statusElement.textContent =
          "Joining room...";
      }

      const roomRef =
        database.ref(
          "gameV2/rooms/" + roomCode
        );

      const snapshot =
        await roomRef.once("value");

      if (!snapshot.exists()) {
        if (statusElement) {
          statusElement.textContent =
            "Room not found";
        }

        alert("Room not found");
        return;
      }

      const room =
        snapshot.val();

      if (room.status !== "waiting") {
        if (statusElement) {
          statusElement.textContent =
            "Room unavailable";
        }

        alert("Room unavailable");
        return;
      }

      if (
        room.playerCount &&
        room.playerCount >= 2
      ) {
        if (statusElement) {
          statusElement.textContent =
            "Room is full";
        }

        alert("Room is full");
        return;
      }

      await roomRef.update({
        status: "ready",
        playerCount: 2,
        joinedAt:
          firebase.database.ServerValue.TIMESTAMP
      });

      this.currentRoomCode = roomCode;

      if (statusElement) {
        statusElement.textContent =
          "JOINED ROOM: " + roomCode;
      }

      alert(
        "Joined room: " + roomCode
      );

    } catch (error) {
      console.error(error);

      if (statusElement) {
        statusElement.textContent =
          "Could not join room";
      }

      alert("Could not join room");
    }
  }
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    GameApp.init();
  }
);
