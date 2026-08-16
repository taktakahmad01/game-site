const OnlineGame = {

  uid: null,
  opponentUid: null,

  myPresenceRef: null,
opponentPresenceRef: null,

  roomId: null,
  roomRef: null,

  myMove: null,

  currentRound: 1,

  resolverUid: null,
  isResolver: false,

  resolving: false,
  nextRoundTimer: null,
  lastScheduledRound: null,


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


      const playerUids =
        Object.keys(
          room.players
        );


      this.opponentUid =
        playerUids.find(
          uid => uid !== this.uid
        );


      if (!this.opponentUid) {

        console.error(
          "Opponent not found"
        );

        return;
      }
      this.watchGamePresence();


      /*
       * واحد فقط من الجوج هو اللي
       * غادي يحسب النتيجة.
       * هكا ما تتحسبش مرتين.
       */

      const sortedUids =
        [...playerUids].sort();


      this.resolverUid =
        sortedUids[0];


      this.isResolver =
        this.uid ===
        this.resolverUid;


      const myPlayer =
        room.players[
          this.uid
        ];


      const opponent =
        room.players[
          this.opponentUid
        ];


      this.showGameScreen(
        myPlayer,
        opponent,
        roomId
      );


      this.bindChoices();


      await this.ensureGameState(
        room
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


  async ensureGameState(room) {

    if (!this.isResolver) {
      return;
    }


    const updates = {};


    if (!room.round) {

      updates["round"] = 1;

    }


    if (!room.scores) {

      updates[
        "scores/" +
        this.uid
      ] = 0;


      updates[
        "scores/" +
        this.opponentUid
      ] = 0;

    }


    if (
      Object.keys(updates).length > 0
    ) {

      await database
        .ref(
          "gameV2/rooms/" +
          this.roomId
        )
        .update(updates);

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


    document
      .getElementById(
        "gameMyAvatar"
      )
      .textContent =
      me.avatar || "👤";


    document
      .getElementById(
        "gameMyUsername"
      )
      .textContent =
      me.username || "Player";


    document
      .getElementById(
        "gameMyCountry"
      )
      .textContent =
      this.formatCountry(
        me.country
      );


    document
      .getElementById(
        "gameOpponentAvatar"
      )
      .textContent =
      opponent.avatar || "👤";


    document
      .getElementById(
        "gameOpponentUsername"
      )
      .textContent =
      opponent.username ||
      "Opponent";


    document
      .getElementById(
        "gameOpponentCountry"
      )
      .textContent =
      this.formatCountry(
        opponent.country
      );


    document
      .getElementById(
        "gameRoomId"
      )
      .textContent =
      roomId;


    gameScreen.classList.remove(
      "app-hidden"
    );

  },


  bindChoices() {

    const buttons =
      document.querySelectorAll(
        ".rps-choice"
      );


    buttons.forEach(
      button => {

        /*
         * ما نربطوش نفس الزر مرتين
         * إلا رجع اللاعب للشاشة.
         */

        if (
          button.dataset.bound ===
          "yes"
        ) {
          return;
        }


        button.dataset.bound =
          "yes";


        button.addEventListener(
          "click",
          async () => {

            const move =
              button.dataset.move;


            await this.chooseMove(
              move
            );

          }
        );

      }
    );

  },


  async chooseMove(move) {

    if (
      !this.roomId ||
      this.myMove
    ) {
      return;
    }


    if (
      ![
        "rock",
        "paper",
        "scissors"
      ].includes(move)
    ) {
      return;
    }


    this.myMove =
      move;


    this.disableChoices();


    const myHand =
      document.getElementById(
        "mySelectedMove"
      );


    if (myHand) {

      myHand.textContent =
        this.moveEmoji(move);

    }


    const status =
      document.getElementById(
        "gameStatus"
      );


    if (status) {

      status.textContent =
        "كنستناو اختيار الخصم...";

    }


    try {

      await database
        .ref(
          "gameV2/rooms/" +
          this.roomId +
          "/moves/" +
          this.uid
        )
        .set({

          move: move,

          selected: true,

          selectedAt:
            firebase.database
              .ServerValue
              .TIMESTAMP

        });


    } catch (error) {

      console.error(
        "Choose move error:",
        error
      );


      this.myMove = null;

      this.enableChoices();

    }

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
      async snapshot => {

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

          return;
        }


        this.renderRoom(
          room
        );


        /*
         * غير Resolver هو اللي
         * كيحسب نتيجة الجولة.
         */

        if (this.isResolver) {

          await this.tryResolveRound(
            room
          );

        }

      }
    );

  },


  renderRoom(room) {

    const round =
      Number(
        room.round || 1
      );


    /*
     * جولة جديدة
     */

    if (
      round !==
      this.currentRound
    ) {

      this.currentRound =
        round;


      this.resetRoundUI();

    }


    const roundText =
      document.getElementById(
        "gameRound"
      );


    if (roundText) {

      roundText.textContent =
        "ROUND " + round;

    }


    /*
     * SCORE
     */

    const myScore =
      room.scores
      ?
      Number(
        room.scores[
          this.uid
        ] || 0
      )
      :
      0;


    const opponentScore =
      room.scores
      ?
      Number(
        room.scores[
          this.opponentUid
        ] || 0
      )
      :
      0;


    document
      .getElementById(
        "gameMyScore"
      )
      .textContent =
      myScore;


    document
      .getElementById(
        "gameOpponentScore"
      )
      .textContent =
      opponentScore;


    const myMoveData =
      room.moves
      ?
      room.moves[
        this.uid
      ]
      :
      null;


    const opponentMoveData =
      room.moves
      ?
      room.moves[
        this.opponentUid
      ]
      :
      null;


    /*
     * إلا النتيجة واجدة:
     * ما نظهروش Done.
     * مباشرة النتيجة.
     */

    if (room.roundResult) {

      this.renderResult(
        room.roundResult
      );

      return;

    }


    /*
     * الخصم سبقني واختار:
     * نوري غير ✅
     */

    if (
      opponentMoveData &&
      !myMoveData
    ) {

      this.showOpponentReady();

    }


    /*
     * أنا اخترت والخصم باقي:
     */

    if (
      myMoveData &&
      !opponentMoveData
    ) {

      const status =
        document.getElementById(
          "gameStatus"
        );


      if (status) {

        status.textContent =
          "كنستناو اختيار الخصم...";

      }

    }


    /*
     * بجوج اختارو:
     * ما نظهروش ✅ بجوج.
     * نخليو resolver يحسب النتيجة.
     */

    if (
      myMoveData &&
      opponentMoveData
    ) {

      const status =
        document.getElementById(
          "gameStatus"
        );


      if (status) {

        status.textContent =
          "جاري حساب النتيجة...";

      }

    }

  },


  showOpponentReady() {

    const opponentReady =
      document.getElementById(
        "opponentReady"
      );


    if (opponentReady) {

      opponentReady.classList.remove(
        "game-ready-hidden"
      );

      opponentReady.textContent =
        "✅";

    }


    const status =
      document.getElementById(
        "gameStatus"
      );


    if (status) {

      status.textContent =
        "الخصم سبقك واختار";

    }

  },


  async tryResolveRound(room) {

    if (
      this.resolving ||
      room.roundResult ||
      !room.moves
    ) {
      return;
    }


    const myMoveData =
      room.moves[
        this.uid
      ];


    const opponentMoveData =
      room.moves[
        this.opponentUid
      ];


    if (
      !myMoveData ||
      !opponentMoveData
    ) {
      return;
    }


    this.resolving = true;


    const round =
      Number(
        room.round || 1
      );


    const move1 =
      myMoveData.move;


    const move2 =
      opponentMoveData.move;


    const winnerUid =
      this.getWinner(
        this.uid,
        move1,
        this.opponentUid,
        move2
      );


    const currentScores =
      room.scores || {};


    let myScore =
      Number(
        currentScores[
          this.uid
        ] || 0
      );


    let opponentScore =
      Number(
        currentScores[
          this.opponentUid
        ] || 0
      );


    if (
      winnerUid ===
      this.uid
    ) {

      myScore++;

    }


    if (
      winnerUid ===
      this.opponentUid
    ) {

      opponentScore++;

    }


    const updates = {};


    updates[
      "scores/" +
      this.uid
    ] =
      myScore;


    updates[
      "scores/" +
      this.opponentUid
    ] =
      opponentScore;


    updates[
      "roundResult"
    ] = {

      round: round,

      winnerUid:
        winnerUid || "",

      draw:
        winnerUid === null,

      moves: {

        [this.uid]:
          move1,

        [this.opponentUid]:
          move2

      },

      createdAt:
        firebase.database
          .ServerValue
          .TIMESTAMP

    };


    try {

      await database
        .ref(
          "gameV2/rooms/" +
          this.roomId
        )
        .update(updates);


    } catch (error) {

      console.error(
        "Resolve round error:",
        error
      );


      this.resolving = false;

    }

  },


  renderResult(result) {

    this.disableChoices();


    const opponentReady =
      document.getElementById(
        "opponentReady"
      );


    if (opponentReady) {

      opponentReady.classList.add(
        "game-ready-hidden"
      );

    }


    const myMove =
      result.moves
      ?
      result.moves[
        this.uid
      ]
      :
      null;


    const opponentMove =
      result.moves
      ?
      result.moves[
        this.opponentUid
      ]
      :
      null;


    const myHand =
      document.getElementById(
        "mySelectedMove"
      );


    const opponentHand =
      document.getElementById(
        "opponentSelectedMove"
      );


    if (myHand) {

      myHand.textContent =
        this.moveEmoji(
          myMove
        );

    }


    if (opponentHand) {

      opponentHand.textContent =
        this.moveEmoji(
          opponentMove
        );

    }


    const status =
      document.getElementById(
        "gameStatus"
      );


    if (result.draw) {

      status.textContent =
        "تعادل 🤝";

      status.className =
        "game-result game-draw";

    }

    else if (
      result.winnerUid ===
      this.uid
    ) {

      status.textContent =
        "ربحت الجولة 🔥";

      status.className =
        "game-result game-win";

    }

    else {

      status.textContent =
        "خسرت الجولة";

      status.className =
        "game-result game-lose";

    }


    /*
     * غير Resolver كيبدأ
     * الجولة الجديدة.
     */

    if (
      this.isResolver &&
      this.lastScheduledRound !==
      result.round
    ) {

      this.lastScheduledRound =
        result.round;


      this.nextRoundTimer =
        setTimeout(
          async () => {

            await this.startNextRound(
              result.round
            );

          },
          1800
        );

    }

  },


  async startNextRound(
    finishedRound
  ) {

    try {

      const roomRef =
        database.ref(
          "gameV2/rooms/" +
          this.roomId
        );


      const snapshot =
        await roomRef.once(
          "value"
        );


      if (!snapshot.exists()) {

        return;

      }


      const room =
        snapshot.val();


      if (
        !room.roundResult ||
        Number(
          room.roundResult.round
        ) !==
        Number(
          finishedRound
        )
      ) {

        return;

      }


      await roomRef.update({

        round:
          Number(
            finishedRound
          ) + 1,

        moves:
          null,

        roundResult:
          null

      });


      this.resolving =
        false;


    } catch (error) {

      console.error(
        "Next round error:",
        error
      );


      this.resolving =
        false;

    }

  },


  resetRoundUI() {

    this.myMove =
      null;


    this.resolving =
      false;


    const myHand =
      document.getElementById(
        "mySelectedMove"
      );


    const opponentHand =
      document.getElementById(
        "opponentSelectedMove"
      );


    const opponentReady =
      document.getElementById(
        "opponentReady"
      );


    const status =
      document.getElementById(
        "gameStatus"
      );


    if (myHand) {

      myHand.textContent =
        "❔";

    }


    if (opponentHand) {

      opponentHand.textContent =
        "❔";

    }


    if (opponentReady) {

      opponentReady.classList.add(
        "game-ready-hidden"
      );

    }


    if (status) {

      status.textContent =
        "اختار الحركة ديالك";

      status.className =
        "game-status";

    }


    this.enableChoices();

  },


  disableChoices() {

    document
      .querySelectorAll(
        ".rps-choice"
      )
      .forEach(
        button => {

          button.disabled = true;

        }
      );

  },


  enableChoices() {

    document
      .querySelectorAll(
        ".rps-choice"
      )
      .forEach(
        button => {

          button.disabled = false;

        }
      );

  },


  getWinner(
    uid1,
    move1,
    uid2,
    move2
  ) {

    if (move1 === move2) {

      return null;

    }


    if (

      (
        move1 === "rock" &&
        move2 === "scissors"
      )

      ||

      (
        move1 === "paper" &&
        move2 === "rock"
      )

      ||

      (
        move1 === "scissors" &&
        move2 === "paper"
      )

    ) {

      return uid1;

    }


    return uid2;

  },


  moveEmoji(move) {

    const moves = {

      rock:
        "✊",

      paper:
        "🖐️",

      scissors:
        "✌️"

    };


    return (
      moves[move] ||
      "❔"
    );

  },


  exitToHome() {

    if (this.roomRef) {

      this.roomRef.off();

      this.roomRef = null;

    }


    if (this.nextRoundTimer) {

      clearTimeout(
        this.nextRoundTimer
      );

      this.nextRoundTimer =
        null;

    }


    this.roomId =
      null;

    this.opponentUid =
      null;

    this.myMove =
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
