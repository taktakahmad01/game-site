const GameMatchmaking = {

  uid: null,
  profile: null,
  queueRef: null,
  searching: false,


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

            this.startSearching();

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


    if (this.playOnlineBtn) {

      this.playOnlineBtn.disabled = true;

      this.playOnlineBtn
        .querySelector("strong")
        .textContent =
        "SEARCHING...";


      this.playOnlineBtn
        .querySelector("span")
        .textContent =
        "كنقلبو ليك على لاعب...";

    }


    this.queueRef =
      database.ref(
        "gameV2/matchmaking/" +
        this.uid
      );


    try {

      /*
       * إلا اللاعب سد Browser
       * وهو كيقلب، Queue ديالو
       * تتمسح من Firebase.
       */
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


      console.log(
        "🔎 Searching for opponent..."
      );


    } catch (error) {

      console.error(
        "Start matchmaking error:",
        error
      );


      this.searching = false;


      if (this.playOnlineBtn) {

        this.playOnlineBtn.disabled =
          false;

        this.playOnlineBtn
          .querySelector("strong")
          .textContent =
          "PLAY ONLINE";

        this.playOnlineBtn
          .querySelector("span")
          .textContent =
          "قلب على لاعب Online";

      }

    }

  },


  async cancelSearching() {

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


    this.searching = false;
    this.queueRef = null;


    if (this.playOnlineBtn) {

      this.playOnlineBtn.disabled =
        false;

      this.playOnlineBtn
        .querySelector("strong")
        .textContent =
        "PLAY ONLINE";

      this.playOnlineBtn
        .querySelector("span")
        .textContent =
        "قلب على لاعب Online";

    }

  }

};


window.addEventListener(
  "playerProfileReady",
  () => {

    GameMatchmaking.init();

  }
);
