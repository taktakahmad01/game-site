const GameApp = {

  currentRoomCode: null,

  init() {

    this.createBtn = document.getElementById("createGame");
    this.joinBtn = document.getElementById("joinGame");
    this.status = document.getElementById("status");

    this.joinModal = document.getElementById("joinModal");
    this.closeJoinModalBtn = document.getElementById("closeJoinModal");
    this.roomCodeInput = document.getElementById("roomCodeInput");
    this.confirmJoinBtn = document.getElementById("confirmJoin");
    this.joinError = document.getElementById("joinError");

    this.waitingScreen = document.getElementById("waitingScreen");
    this.waitingRoomCode = document.getElementById("waitingRoomCode");
    this.waitingTitle = document.getElementById("waitingTitle");
    this.waitingText = document.getElementById("waitingText");
    this.cancelRoomBtn = document.getElementById("cancelRoom");

    this.createBtn.addEventListener("click", () => {
      this.createRoom();
    });

    this.joinBtn.addEventListener("click", () => {
      this.openJoinModal();
    });

    this.closeJoinModalBtn.addEventListener("click", () => {
      this.closeJoinModal();
    });

    this.confirmJoinBtn.addEventListener("click", () => {
      this.joinRoom();
    });

    this.cancelRoomBtn.addEventListener("click", () => {
      this.cancelRoom();
    });

    this.roomCodeInput.addEventListener("input", () => {

      this.roomCodeInput.value =
        this.roomCodeInput.value
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");

      this.joinError.textContent = "";

    });

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


  async createRoom() {

    try {

      this.status.textContent = "Creating room...";

      const roomCode =
        await this.createUniqueRoomCode();

      await database
        .ref("gameV2/rooms/" + roomCode)
        .set({

          code: roomCode,
          status: "waiting",
          playerCount: 1,

          createdAt:
            firebase.database.ServerValue.TIMESTAMP

        });

      this.currentRoomCode = roomCode;

      this.showWaitingRoom(
        roomCode,
        false
      );
this.watchRoom(roomCode);
    } catch (error) {

      console.error(error);

      this.status.textContent =
        "Could not create room";

    }

  },


  openJoinModal() {

    this.roomCodeInput.value = "";

    this.joinError.textContent = "";

    this.joinModal.classList.remove("hidden");

    setTimeout(() => {
      this.roomCodeInput.focus();
    }, 150);

  },


  closeJoinModal() {

    this.joinModal.classList.add("hidden");

  },


  async joinRoom() {

    const roomCode =
      this.roomCodeInput.value
        .trim()
        .toUpperCase();

    if (roomCode.length !== 6) {

      this.joinError.textContent =
        "دخل الكود المكوّن من 6 حروف";

      return;

    }

    this.confirmJoinBtn.disabled = true;
    this.confirmJoinBtn.textContent = "جاري الدخول...";

    try {

      const roomRef =
        database.ref(
          "gameV2/rooms/" + roomCode
        );

      const snap =
        await roomRef.once("value");

      if (!snap.exists()) {

        this.joinError.textContent =
          "هاد الغرفة ما كايناش";

        return;

      }

      const room = snap.val();

      if (room.status !== "waiting") {

        this.joinError.textContent =
          "هاد الغرفة ما بقاتش متاحة";

        return;

      }

      if (room.playerCount >= 2) {

        this.joinError.textContent =
          "الغرفة عامرة";

        return;

      }

      await roomRef.update({

        status: "ready",
        playerCount: 2,

        joinedAt:
          firebase.database.ServerValue.TIMESTAMP

      });

      this.currentRoomCode = roomCode;

      this.closeJoinModal();

      this.showWaitingRoom(
        roomCode,
        true
      );

    } catch (error) {

      console.error(error);

      this.joinError.textContent =
        "وقع مشكل، عاود جرب";

    } finally {

      this.confirmJoinBtn.disabled = false;
      this.confirmJoinBtn.textContent = "دخول";

    }

  },


  showWaitingRoom(roomCode, joined) {

    this.waitingRoomCode.textContent =
      roomCode;

    if (joined) {

      this.waitingTitle.textContent =
        "تم الدخول للغرفة ✅";

      this.waitingText.textContent =
        "اللاعبين بجوج متصلين";

    } else {

      this.waitingTitle.textContent =
        "كنستناو اللاعب الثاني...";

      this.waitingText.textContent =
        "شارك الكود مع صاحبك";

    }

    this.waitingScreen.classList.remove(
      "hidden"
    );

  },
watchRoom(roomCode) {

  const roomRef = database.ref(
    "gameV2/rooms/" + roomCode
  );

  roomRef.on("value", (snapshot) => {

    if (!snapshot.exists()) {
      return;
    }

    const room = snapshot.val();

    if (
      room.status === "ready" &&
      room.playerCount >= 2
    ) {

      this.waitingTitle.textContent =
        "اللاعب الثاني دخل ✅";

      this.waitingText.textContent =
        "اللاعبين بجوج متصلين";

    }

  });

},

  async cancelRoom() {

    if (this.currentRoomCode) {

      try {

        await database
          .ref(
            "gameV2/rooms/" +
            this.currentRoomCode
          )
          .remove();

      } catch (error) {

        console.error(error);

      }

    }

    this.currentRoomCode = null;

    this.waitingScreen.classList.add(
      "hidden"
    );

    this.status.textContent =
      "جاهز للعب";

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => GameApp.init()
);
