const OnlineGame = {

  uid: null,
  roomId: null,
  roomRef: null,

  async init() {

    try {

      const user =
        await GameAuth.init();

      if (!user) {
        return;
      }

      this.uid = user.uid;

      const assignmentRef =
        database.ref(
          "gameV2/matchAssignments/" +
          this.uid
        );

      assignmentRef.on(
        "value",
        async (snapshot) => {

          if (!snapshot.exists()) {
            return;
          }

          const assignment =
            snapshot.val();

          if (
            !assignment ||
            !assignment.roomId
          ) {
            return;
          }

          if (
            this.roomId ===
            assignment.roomId
          ) {
            return;
          }

          this.roomId =
            assignment.roomId;

          await this.openRoom(
            this.roomId
          );

        }
      );

    } catch (error) {

      console.error(
        "OnlineGame init error:",
        error
      );

    }

  },


  async openRoom(roomId) {

    try {

      const roomRef =
        database.ref(
          "gameV2/rooms/" +
          roomId
        );

      const snapshot =
        await roomRef.once(
          "value"
        );

      if (!snapshot.exists()) {

        console.error(
          "Room not found"
        );

        return;
      }

      const room =
        snapshot.val();

      if (
        !room.players ||
        !room.players[this.uid]
      ) {

        console.error(
          "Player not inside room"
        );

        return;
      }

      const myPlayer =
        room.players[this.uid];

      let opponent =
        null;

      Object.keys(
        room.players
      ).forEach(
        (playerUid) => {

          if (
            playerUid !==
            this.uid
          ) {

            opponent =
              room.players[playerUid];

          }

        }
      );

      if (!opponent) {

        console.error(
          "Opponent not found"
        );

        return;
      }

      this.showGameScreen(
        myPlayer,
        opponent,
        roomId
      );

      this.watchRoom(
        roomId
      );

    } catch (error) {

      console.error(
        "Open room error:",
        error
      );

    }

  },


  showGameScreen(
    me,
    opponent,
    roomId
  ) {

    const homeScreen =
      document.getElementById(
        "homeScreen"
      );

    const waitingScreen =
      document.getElementById(
        "waitingScreen"
      );

    const gameScreen =
      document.getElementById(
        "gameScreen"
      );


    if (homeScreen) {

      homeScreen.classList.add(
        "app-hidden"
      );

    }


    if (waitingScreen) {

      waitingScreen.classList.add(
        "hidden"
      );

    }


    if (!gameScreen) {

      console.error(
        "gameScreen HTML not found"
      );

      return;
    }


    const myAvatar =
      document.getElementById(
        "gameMyAvatar"
      );

    const myUsername =
      document.getElementById(
        "gameMyUsername"
      );

    const myCountry =
      document.getElementById(
        "gameMyCountry"
      );


    const opponentAvatar =
      document.getElementById(
        "gameOpponentAvatar"
      );

    const opponentUsername =
      document.getElementById(
        "gameOpponentUsername"
      );

    const opponentCountry =
      document.getElementById(
        "gameOpponentCountry"
      );


    const roomCodeText =
      document.getElementById(
        "gameRoomId"
      );


    if (myAvatar) {

      myAvatar.textContent =
        me.avatar || "👤";

    }


    if (myUsername) {

      myUsername.textContent =
        me.username || "Player";

    }


    if (myCountry) {

      myCountry.textContent =
        this.formatCountry(
          me.country
        );

    }


    if (opponentAvatar) {

      opponentAvatar.textContent =
        opponent.avatar || "👤";

    }


    if (opponentUsername) {

      opponentUsername.textContent =
        opponent.username || "Opponent";

    }


    if (opponentCountry) {

      opponentCountry.textContent =
        this.formatCountry(
          opponent.country
        );

    }


    if (roomCodeText) {

      roomCodeText.textContent =
        roomId;

    }


    gameScreen.classList.remove(
      "app-hidden"
    );

  },


  watchRoom(roomId) {

    if (this.roomRef) {

      this.roomRef.off();

    }

    this.roomRef =
      database.ref(
        "gameV2/rooms/" +
        roomId
      );


    this.roomRef.on(
      "value",
      (snapshot) => {

        if (!snapshot.exists()) {

          this.exitToHome();

          return;
        }

        const room =
          snapshot.val();

        if (
          !room.players ||
          !room.players[this.uid]
        ) {

          this.exitToHome();

        }

      }
    );

  },


  exitToHome() {

    if (this.roomRef) {

      this.roomRef.off();

      this.roomRef = null;

    }


    this.roomId =
      null;


    const gameScreen =
      document.getElementById(
        "gameScreen"
      );

    const homeScreen =
      document.getElementById(
        "homeScreen"
      );


    if (gameScreen) {

      gameScreen.classList.add(
        "app-hidden"
      );

    }


    if (homeScreen) {

      homeScreen.classList.remove(
        "app-hidden"
      );

    }

  },


  formatCountry(country) {

    const countries = {

      Morocco:
        "🇲🇦 Morocco",

      Algeria:
        "🇩🇿 Algeria",

      Tunisia:
        "🇹🇳 Tunisia",

      Egypt:
        "🇪🇬 Egypt",

      "Saudi Arabia":
        "🇸🇦 Saudi Arabia",

      UAE:
        "🇦🇪 UAE",

      Qatar:
        "🇶🇦 Qatar",

      Other:
        "🌍 Other"

    };


    return (
      countries[country] ||
      "🌍 " + country
    );

  }

};


window.addEventListener(
  "playerProfileReady",
  () => {

    OnlineGame.init();

  }
);
