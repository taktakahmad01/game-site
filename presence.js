const GamePresence = {

  uid: null,
  userRef: null,
  connectedRef: null,


  async init() {

    try {

      const user =
        await GameAuth.init();

      if (!user) {
        return;
      }


      this.uid = user.uid;

      this.userRef =
        database.ref(
          "gameV2/users/" + this.uid
        );


      /*
       * مهم:
       * ما نشغلوش Presence حتى يكون
       * Profile موجود فعلاً.
       */
      const profileSnapshot =
        await this.userRef.once("value");


      if (!profileSnapshot.exists()) {
        return;
      }


      this.connectedRef =
        database.ref(
          ".info/connected"
        );


      this.connectedRef.on(
        "value",
        async (snapshot) => {

          /*
           * false = مازال ما متصلش
           * أو الاتصال تقطع
           */
          if (snapshot.val() !== true) {
            return;
          }


          /*
           * قبل ما نقولو Online،
           * نسجلو عند السيرفر شنو يدير
           * إلا الاتصال تقطع.
           */
          await this.userRef
            .onDisconnect()
            .update({

              online: false,

              status: "offline",

              lastSeen:
                firebase.database
                  .ServerValue
                  .TIMESTAMP

            });


          /*
           * دابا اللاعب متصل فعلاً.
           */
          await this.userRef.update({

            online: true,

            status: "online",

            lastSeen:
              firebase.database
                .ServerValue
                .TIMESTAMP

          });

        }
      );


    } catch (error) {

      console.error(
        "Presence error:",
        error
      );

    }

  }

};


window.addEventListener(
  "playerProfileReady",
  () => {

    GamePresence.init();

  }
);
