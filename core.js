const GameApp = {

  version: "1.3.0",

  currentRoomCode: null,
  playerRole: null,
  roomListenerRef: null,


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


    if (this.createBtn) {
      this.createBtn.addEventListener("click", () => {
        this.createRoom();
      });
    }


    if (this.joinBtn) {
      this.joinBtn.addEventListener("click", () => {
        this.openJoinModal();
      });
    }


    if (this.closeJoinModalBtn) {
      this.closeJoinModalBtn.addEventListener("click", () => {
        this.closeJoinModal();
      });
    }


    if (this.confirmJoinBtn) {
      this.confirmJoinBtn.addEventListener("click", () => {
        this.joinRoom();
      });
    }


    if (this.cancelRoomBtn) {
      this.cancelRoomBtn.addEventListener("click", () => {
        this.leaveRoom();
      });
    }


    if (this.roomCodeInput) {

      this.roomCodeInput.addEventListener("input", () => {

        this.roomCodeInput.value =
          this.roomCodeInput.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

        if (this.joinError) {
          this.joinError.textContent = "";
        }

      });

    }


    /* رجع Session إلا دار Refresh */
    this.restoreSession();

  },


  saveSession(roomCode, role) {

    localStorage.setItem(
      "gameRoomCode",
      roomCode
    );

    localStorage.setItem(
      "gamePlayerRole",
      role
    );

  },


  clearSession() {

    localStorage.removeItem(
      "gameRoomCode"
    );

    localStorage.removeItem(
      "gamePlayerRole"
    );

  },


  async restoreSession() {

    const roomCode =
      localStorage.getItem(
        "gameRoomCode"
      );

    const role =
      localStorage.getItem(
        "gamePlayerRole"
      );


    if (!roomCode || !role) {
      return;
    }


    try {

      const roomRef =
        database.ref(
          "gameV2/rooms/" + roomCode
        );


      const snapshot =
        await roomRef.once("value");


      /* الغرفة تسالات أو تمسحات */
      if (!snapshot.exists()) {

        this.clearSession();

        return;

      }


      const room =
        snapshot.val();


      this.currentRoomCode =
        roomCode;

      this.playerRole =
        role;


      const joined =
        room.status === "ready" &&
        room.playerCount >= 2;


      this.showWaitingRoom(
        roomCode,
        joined
      );


      this.watchRoom(
        roomCode
      );


    } catch (error) {

      console.error(
        "Restore session error:",
        error
      );

    }

  },


  generateRoomCode() {

    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i++) {

      code += chars.charAt(
        Math.floor(
          Math.random() * chars.length
        )
      );

    }

    return code;

  },


  async createUniqueRoomCode() {

    while (true) {

      const code =
        this.generateRoomCode();


      const snapshot =
        await database
          .ref(
            "gameV2/rooms/" + code
          )
          .once("value");


      if (!snapshot.exists()) {
        return code;
      }

    }

  },


  async createRoom() {

    try {

      if (this.status) {

        this.status.textContent =
          "Creating room...";

      }


      const roomCode =
        await this.createUniqueRoomCode();


      await database
        .ref(
          "gameV2/rooms/" + roomCode
        )
        .set({

          code: roomCode,

          status: "waiting",

          playerCount: 1,

          createdAt:
            firebase.database
              .ServerValue
              .TIMESTAMP

        });


      this.currentRoomCode =
        roomCode;

      this.playerRole =
        "host";


      this.saveSession(
        roomCode,
        "host"
      );


      this.showWaitingRoom(
        roomCode,
        false
      );


      this.watchRoom(
        roomCode
      );


    } catch (error) {

      console.error(
        "Create room error:",
        error
      );


      if (this.status) {

        this.status.textContent =
          "Could not create room";

      }

    }

  },


  openJoinModal() {

    if (!this.joinModal) {
      return;
    }


    if (this.roomCodeInput) {
      this.roomCodeInput.value = "";
    }


    if (this.joinError) {
      this.joinError.textContent = "";
    }


    this.joinModal.classList.remove(
      "hidden"
    );


    setTimeout(() => {

      if (this.roomCodeInput) {
        this.roomCodeInput.focus();
      }

    }, 150);

  },


  closeJoinModal() {

    if (!this.joinModal) {
      return;
    }


    this.joinModal.classList.add(
      "hidden"
    );

  },


  async joinRoom() {

    if (!this.roomCodeInput) {
      return;
    }


    const roomCode =
      this.roomCodeInput.value
        .trim()
        .toUpperCase();


    if (roomCode.length !== 6) {

      if (this.joinError) {

        this.joinError.textContent =
          "دخل الكود المكوّن من 6 حروف";

      }

      return;

    }


    if (this.confirmJoinBtn) {

      this.confirmJoinBtn.disabled =
        true;

      this.confirmJoinBtn.textContent =
        "جاري الدخول...";

    }


    try {

      const roomRef =
        database.ref(
          "gameV2/rooms/" + roomCode
        );


      const snapshot =
        await roomRef.once("value");


      if (!snapshot.exists()) {

        if (this.joinError) {

          this.joinError.textContent =
            "هاد الغرفة ما كايناش";

        }

        return;

      }


      const room =
        snapshot.val();


      if (room.status !== "waiting") {

        if (this.joinError) {

          this.joinError.textContent =
            "هاد الغرفة ما بقاتش متاحة";

        }

        return;

      }


      if (
        room.playerCount &&
        room.playerCount >= 2
      ) {

        if (this.joinError) {

          this.joinError.textContent =
            "الغرفة عامرة";

        }

        return;

      }


      await roomRef.update({

        status: "ready",

        playerCount: 2,

        joinedAt:
          firebase.database
            .ServerValue
            .TIMESTAMP

      });


      this.currentRoomCode =
        roomCode;

      this.playerRole =
        "guest";


      this.saveSession(
        roomCode,
        "guest"
      );


      this.closeJoinModal();


      this.showWaitingRoom(
        roomCode,
        true
      );


      this.watchRoom(
        roomCode
      );


    } catch (error) {

      console.error(
        "Join room error:",
        error
      );


      if (this.joinError) {

        this.joinError.textContent =
          "وقع مشكل، عاود جرب";

      }


    } finally {

      if (this.confirmJoinBtn) {

        this.confirmJoinBtn.disabled =
          false;

        this.confirmJoinBtn.textContent =
          "دخول";

      }

    }

  },


  showWaitingRoom(
    roomCode,
    joined
  ) {

    if (this.waitingRoomCode) {

      this.waitingRoomCode.textContent =
        roomCode;

    }


    if (joined) {

      if (this.waitingTitle) {

        this.waitingTitle.textContent =
          "اللاعب الثاني دخل ✅";

      }


      if (this.waitingText) {

        this.waitingText.textContent =
          "اللاعبين بجوج متصلين";

      }


    } else {

      if (this.waitingTitle) {

        this.waitingTitle.textContent =
          "كنستناو اللاعب الثاني...";

      }


      if (this.waitingText) {

        this.waitingText.textContent =
          "شارك الكود مع صاحبك";

      }

    }


    if (this.waitingScreen) {

      this.waitingScreen.classList.remove(
        "hidden"
      );

    }

  },


  watchRoom(roomCode) {

    this.stopWatchingRoom();


    const roomRef =
      database.ref(
        "gameV2/rooms/" + roomCode
      );


    this.roomListenerRef =
      roomRef;


    roomRef.on(
      "value",
      (snapshot) => {

        /* الغرفة تمسحات */
        if (!snapshot.exists()) {

          this.stopWatchingRoom();

          this.clearSession();

          this.currentRoomCode =
            null;

          this.playerRole =
            null;


          if (this.waitingTitle) {

            this.waitingTitle.textContent =
              "تم إغلاق الغرفة";

          }


          if (this.waitingText) {

            this.waitingText.textContent =
              "الغرفة ما بقاتش موجودة";

          }

          return;

        }


        const room =
          snapshot.val();


        /*
         * مهم:
         * هاد listener خدام فالتليفون
         * اللي خلق الغرفة وحتى اللي دخل.
         */
        if (
          room.status === "ready" &&
          Number(room.playerCount) >= 2
        ) {

          if (this.waitingTitle) {

            this.waitingTitle.textContent =
              "اللاعب الثاني دخل ✅";

          }


          if (this.waitingText) {

            this.waitingText.textContent =
              "اللاعبين بجوج متصلين";

          }

        }


        if (
          room.status === "waiting" &&
          Number(room.playerCount) === 1
        ) {

          if (this.waitingTitle) {

            this.waitingTitle.textContent =
              "كنستناو اللاعب الثاني...";

          }


          if (this.waitingText) {

            this.waitingText.textContent =
              "شارك الكود مع صاحبك";

          }

        }

      },
      (error) => {

        console.error(
          "Room listener error:",
          error
        );

      }
    );

  },


  stopWatchingRoom() {

    if (this.roomListenerRef) {

      this.roomListenerRef.off();

      this.roomListenerRef =
        null;

    }

  },


  async leaveRoom() {

    const roomCode =
      this.currentRoomCode;

    const role =
      this.playerRole;


    this.stopWatchingRoom();


    if (roomCode) {

      try {

        const roomRef =
          database.ref(
            "gameV2/rooms/" + roomCode
          );


        /*
         * Host هو اللي كيمسح الغرفة.
         */
        if (role === "host") {

          await roomRef.remove();

        }

        /*
         * Guest غير كيخرج،
         * والغرفة ترجع انتظار.
         */
        else if (role === "guest") {

          const snapshot =
            await roomRef.once(
              "value"
            );


          if (snapshot.exists()) {

            await roomRef.update({

              status: "waiting",

              playerCount: 1

            });

          }

        }


      } catch (error) {

        console.error(
          "Leave room error:",
          error
        );

      }

    }


    this.clearSession();


    this.currentRoomCode =
      null;

    this.playerRole =
      null;


    if (this.waitingScreen) {

      this.waitingScreen.classList.add(
        "hidden"
      );

    }


    if (this.status) {

      this.status.textContent =
        "جاهز للعب";

    }

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => {

    GameApp.init();

  }
);
