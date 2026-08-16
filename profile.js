const PlayerProfile = {

  currentUser: null,
  profile: null,
  selectedAvatar: "👦",


  async init() {

    try {

      this.currentUser =
        await GameAuth.init();

      this.screen =
        document.getElementById(
          "profileScreen"
        );

      this.usernameInput =
        document.getElementById(
          "profileUsername"
        );

      this.countryInput =
        document.getElementById(
          "profileCountry"
        );

      this.message =
        document.getElementById(
          "profileMessage"
        );

      this.createButton =
        document.getElementById(
          "createProfile"
        );

      this.avatarButtons =
        document.querySelectorAll(
          ".avatar-choice"
        );


      this.bindAvatarEvents();


      const profileRef =
        database.ref(
          "gameV2/users/" +
          this.currentUser.uid
        );


      const snapshot =
        await profileRef.once(
          "value"
        );


      if (snapshot.exists()) {

        this.profile =
          snapshot.val();

        this.hideProfileScreen();

        this.dispatchReady();

        return;

      }


      this.bindCreateButton();


    } catch (error) {

      console.error(
        "Profile init error:",
        error
      );

    }

  },


  bindAvatarEvents() {

    this.avatarButtons.forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            this.avatarButtons.forEach(
              (item) => {

                item.classList.remove(
                  "selected"
                );

              }
            );


            button.classList.add(
              "selected"
            );


            this.selectedAvatar =
              button.dataset.avatar;

          }
        );

      }
    );

  },


  bindCreateButton() {

    if (!this.createButton) {
      return;
    }


    this.createButton.addEventListener(
      "click",
      async () => {

        await this.createProfile();

      }
    );

  },


  async createProfile() {

    const username =
      this.usernameInput
        .value
        .trim();


    const country =
      this.countryInput
        .value;


    this.message.textContent = "";


    if (
      username.length < 3 ||
      username.length > 15
    ) {

      this.message.textContent =
        "الاسم خاصو يكون بين 3 و15 حرف";

      return;

    }


    if (
      !/^[a-zA-Z0-9_]+$/.test(
        username
      )
    ) {

      this.message.textContent =
        "استعمل غير الحروف والأرقام و _";

      return;

    }


    if (!country) {

      this.message.textContent =
        "اختار البلد ديالك";

      return;

    }


    this.createButton.disabled =
      true;


    this.createButton.textContent =
      "جاري إنشاء الحساب...";


    const usernameKey =
      username.toLowerCase();


    const usernameRef =
      database.ref(
        "gameV2/usernames/" +
        usernameKey
      );


    try {

      let usernameTaken =
        false;


      const transactionResult =
        await usernameRef.transaction(
          (currentValue) => {

            if (
              currentValue === null
            ) {

              return this.currentUser.uid;

            }


            if (
              currentValue ===
              this.currentUser.uid
            ) {

              return currentValue;

            }


            usernameTaken = true;

            return;

          }
        );


      if (
        usernameTaken ||
        !transactionResult.committed
      ) {

        this.message.textContent =
          "هاد Username مستعمل من قبل";

        return;

      }


      const profile = {

        username: username,

        avatar:
          this.selectedAvatar,

        country: country,

        wins: 0,

        online: true,

        status: "online",

        currentRoom: null,

        lastSeen:
          firebase.database
            .ServerValue
            .TIMESTAMP,

        createdAt:
          firebase.database
            .ServerValue
            .TIMESTAMP

      };


      await database
        .ref(
          "gameV2/users/" +
          this.currentUser.uid
        )
        .set(profile);


      const freshProfile =
        await database
          .ref(
            "gameV2/users/" +
            this.currentUser.uid
          )
          .once("value");


      this.profile =
        freshProfile.val();


      this.hideProfileScreen();


      this.dispatchReady();


    } catch (error) {

      console.error(
        "Create profile error:",
        error
      );


      this.message.textContent =
        "وقع مشكل، عاود جرب";


    } finally {

      this.createButton.disabled =
        false;


      this.createButton.textContent =
        "دخول للعبة";

    }

  },


  hideProfileScreen() {

    if (this.screen) {

      this.screen.classList.add(
        "profile-hidden"
      );

    }

  },


  dispatchReady() {

    window.dispatchEvent(
      new CustomEvent(
        "playerProfileReady",
        {
          detail: {
            uid:
              this.currentUser.uid,

            profile:
              this.profile
          }
        }
      )
    );

  },


  getProfile() {

    return this.profile;

  },


  getUid() {

    return this.currentUser
      ? this.currentUser.uid
      : null;

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => {

    PlayerProfile.init();

  }
);
