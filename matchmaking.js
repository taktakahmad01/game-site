const GameMatchmaking = {

  uid: null,
  profile: null,

  queueRef: null,
  queueListenerRef: null,

  searching: false,
  matching: false,


  async init() {

    try {

      const user =
        await GameAuth.init();

      if (!user) {
        return;
      }


      this.uid = user.uid;


      const profileSnapshot =
        await database
          .ref(
            "gameV2/users/" +
            this.uid
          )
          .once("value");


      if (!profileSnapshot.exists()) {
        return;
      }


      this.profile =
        profileSnapshot.val();


      this.playOnlineBtn =
        document.getElementById(
          "playOnline"
        );


      if (this.playOnlineBtn) {

        this.playOnlineBtn.addEventListener(
          "click",
          () => {

            if (this.searching) {

              this.cancelSearching();

            } else {

              this.startSearching();

            }

          }
        );

      }


    } catch (error) {

      console.error(
        "Matchmaking init error:",
        error
      );

    }

  },


  async startSearching() {

    if (
      this.searching ||
      !this.uid ||
      !this.profile
    ) {
      return;
    }


    this.searching = true;
    this.matching = false;


    this.updateButtonSearching();


    this.queueRef =
      database.ref(
        "gameV2/matchmaking/" +
        this.uid
      );


    try {

      await this.queueRef
        .onDisconnect()
        .remove();


      await this.queueRef.set({

        uid:
          this.uid,

        username:
          this.profile.username,

        avatar:
          this.profile.avatar,

        country:
          this.profile.country,

        searching:
          true,

        joinedAt:
          firebase.database
            .ServerValue
            .TIMESTAMP

      });


      this.watchQueue();


      await this.tryFindOpponent();


    } catch (error) {

      console.error(
        "Start matchmaking error:",
        error
      );


      await this.cancelSearching();

    }

  },


  watchQueue() {

    this.stopQueueListener();


    const queueRoot =
      database.ref(
        "gameV2/matchmaking"
      );


    this.queueListenerRef =
      queueRoot;


    queueRoot.on(
      "value",
      async () => {

        if (
          !this.searching ||
          this.matching
        ) {
          return;
        }


        await this.tryFindOpponent();

      }
    );

  },


  async tryFindOpponent() {

    if (
      !this.searching ||
      this.matching
    ) {
      return;
    }


    try {

      const queueSnapshot =
        await database
          .ref(
            "gameV2/matchmaking"
          )
          .once("value");


      if (!queueSnapshot.exists()) {
        return;
      }


      const queue =
        queueSnapshot.val();


      const opponents =
        Object.values(queue)
          .filter(
            (player) => {

              return (
                player &&
                player.uid &&
                player.uid !== this.uid &&
                player.searching === true
              );

            }
          )
          .sort(
            (a, b) => {

              return (
                Number(a.joinedAt || 0) -
                Number(b.joinedAt || 0)
              );

            }
          );


      if (opponents.length === 0) {
        return;
      }


      const opponent =
        opponents[0];


      await this.claimMatch(
        opponent
      );


    } catch (error) {

      console.error(
        "Find opponent error:",
        error
      );

    }

  },


  async claimMatch(opponent) {

    if (
      this.matching ||
      !opponent ||
      !opponent.uid
    ) {
      return;
    }


    /*
     * نفس pair خاصها نفس key
     * بغض النظر شكون سبق.
     */

    const playerIds =
      [
        this.uid,
        opponent.uid
      ].sort();


    const pairKey =
      playerIds.join("_");


    const lockRef =
      database.ref(
        "gameV2/matchLocks/" +
        pairKey
      );


    try {

      const lockResult =
        await lockRef.transaction(
          (currentValue) => {

            /*
             * Lock موجود:
             * Client آخر سبقنا.
             */

            if (currentValue !== null) {
              return;
            }


            /*
             * حنا اللي ربحنا Lock.
             */

            return {

              owner:
                this.uid,

              player1:
                playerIds[0],

              player2:
                playerIds[1],

              createdAt:
                firebase.database
                  .ServerValue
                  .TIMESTAMP

            };

          }
        );


      if (!lockResult.committed) {

        /*
         * شي لاعب آخر خلق Match.
         * ننتاظرو room assignment.
         */

        this.watchForAssignedMatch();

        return;

      }


      this.matching = true;


      /*
       * نتأكد أن بجوج باقين
       * فعلاً فـQueue.
       */

      const checkSnapshot =
        await database
          .ref(
            "gameV2/matchmaking"
          )
          .once("value");


      const freshQueue =
        checkSnapshot.val() || {};


      if (
        !freshQueue[this.uid] ||
        !freshQueue[opponent.uid]
      ) {

        this.matching = false;

        await lockRef.remove();

        return;

      }


      const roomRef =
        database
          .ref(
            "gameV2/rooms"
          )
          .push();


      const roomId =
        roomRef.key;


      /*
       * Room data
       */

      const roomData = {

        roomId:
          roomId,

        type:
          "online",

        status:
          "ready",

        playerCount:
          2,

        createdAt:
          firebase.database
            .ServerValue
            .TIMESTAMP,

        players: {

          [this.uid]: {

            uid:
              this.uid,

            username:
              this.profile.username,

            avatar:
              this.profile.avatar,

            country:
              this.profile.country

          },

          [opponent.uid]: {

            uid:
              opponent.uid,

            username:
              opponent.username,

            avatar:
              opponent.avatar,

            country:
              opponent.country

          }

        }

      };


      /*
       * Multi-location update:
       * Room + assignments + queue removal
       * فعملية وحدة.
       */

      const updates = {};


      updates[
        "gameV2/rooms/" +
        roomId
      ] =
        roomData;


      updates[
        "gameV2/matchAssignments/" +
        this.uid
      ] = {

        roomId:
          roomId,

        opponentUid:
          opponent.uid

      };


      updates[
        "gameV2/matchAssignments/" +
        opponent.uid
      ] = {

        roomId:
          roomId,

        opponentUid:
          this.uid

      };


      updates[
        "gameV2/matchmaking/" +
        this.uid
      ] = null;


      updates[
        "gameV2/matchmaking/" +
        opponent.uid
      ] = null;


      await database
        .ref()
        .update(updates);


      /*
       * Lock ما بقاتش محتاجينها.
       */

      await lockRef.remove();


      await this.queueRef
        ?.onDisconnect()
        .cancel();


      this.stopQueueListener();


      this.searching = false;


      this.openMatchedRoom(
        roomId
      );


    } catch (error) {

      console.error(
        "Claim match error:",
        error
      );


      this.matching = false;

    }

  },


  watchForAssignedMatch() {

    const assignmentRef =
      database.ref(
        "gameV2/matchAssignments/" +
        this.uid
      );


    assignmentRef.on(
      "value",
      (snapshot) => {

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


        assignmentRef.off();


        this.stopQueueListener();


        if (this.queueRef) {

          this.queueRef
            .onDisconnect()
            .cancel();

        }


        this.searching = false;
        this.matching = true;


        this.openMatchedRoom(
          assignment.roomId
        );

      }
    );

  },


  openMatchedRoom(roomId) {

    console.log(
      "✅ Match found:",
      roomId
    );


    if (this.playOnlineBtn) {

      const strong =
        this.playOnlineBtn
          .querySelector("strong");


      const span =
        this.playOnlineBtn
          .querySelector("span");


      if (strong) {
        strong.textContent =
          "MATCH FOUND ✅";
      }


      if (span) {
        span.textContent =
          "تم العثور على لاعب";
      }

    }


    /*
     * دابا مازال ما ندخلوش
     * Game Screen.
     *
     * نخزنو Room فقط باش
     * نجربو Firebase أولاً.
     */

    sessionStorage.setItem(
      "onlineMatchRoom",
      roomId
    );

  },


  updateButtonSearching() {

    if (!this.playOnlineBtn) {
      return;
    }


    const strong =
      this.playOnlineBtn
        .querySelector("strong");


    const span =
      this.playOnlineBtn
        .querySelector("span");


    if (strong) {

      strong.textContent =
        "SEARCHING...";

    }


    if (span) {

      span.textContent =
        "كنقلبو ليك على لاعب...";

    }

  },


  resetButton() {

    if (!this.playOnlineBtn) {
      return;
    }


    this.playOnlineBtn.disabled =
      false;


    const strong =
      this.playOnlineBtn
        .querySelector("strong");


    const span =
      this.playOnlineBtn
        .querySelector("span");


    if (strong) {

      strong.textContent =
        "PLAY ONLINE";

    }


    if (span) {

      span.textContent =
        "قلب على لاعب Online";

    }

  },


  stopQueueListener() {

    if (this.queueListenerRef) {

      this.queueListenerRef.off();

      this.queueListenerRef =
        null;

    }

  },


  async cancelSearching() {

    this.stopQueueListener();


    if (this.queueRef) {

      try {

        await this.queueRef
          .onDisconnect()
          .cancel();


        await this.queueRef.remove();


      } catch (error) {

        console.error(
          "Cancel matchmaking error:",
          error
        );

      }

    }


    this.queueRef =
      null;

    this.searching =
      false;

    this.matching =
      false;


    this.resetButton();

  }

};


window.addEventListener(
  "playerProfileReady",
  () => {

    GameMatchmaking.init();

  }
);
