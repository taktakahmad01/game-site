const PlayerProfile = {

  avatar: "👦",


  init() {

    this.screen =
      document.getElementById(
        "profileScreen"
      );

    this.username =
      document.getElementById(
        "profileUsername"
      );

    this.country =
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


    const savedProfile =
      this.getProfile();


    /*
     * عندو Profile من قبل:
     * ما نوريوش التسجيل.
     */
    if (savedProfile) {

      this.screen.classList.add(
        "profile-hidden"
      );

      return;

    }


    this.bindEvents();

  },


  bindEvents() {

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


            this.avatar =
              button.dataset.avatar;

          }
        );

      }
    );


    this.createButton.addEventListener(
      "click",
      () => {

        this.createProfile();

      }
    );

  },


  createProfile() {

    const username =
      this.username.value.trim();

    const country =
      this.country.value;


    this.message.textContent = "";


    if (username.length < 3) {

      this.message.textContent =
        "الاسم خاصو يكون فيه على الأقل 3 حروف";

      return;

    }


    if (!country) {

      this.message.textContent =
        "اختار البلد ديالك";

      return;

    }


    const profile = {

      username: username,

      country: country,

      avatar: this.avatar,

      wins: 0,

      createdAt: Date.now()

    };


    localStorage.setItem(
      "playerProfile",
      JSON.stringify(profile)
    );


    this.screen.classList.add(
      "profile-hidden"
    );


    window.dispatchEvent(
      new CustomEvent(
        "playerProfileReady",
        {
          detail: profile
        }
      )
    );

  },


  getProfile() {

    try {

      const saved =
        localStorage.getItem(
          "playerProfile"
        );


      if (!saved) {
        return null;
      }


      return JSON.parse(saved);


    } catch (error) {

      localStorage.removeItem(
        "playerProfile"
      );

      return null;

    }

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => {

    PlayerProfile.init();

  }
);
