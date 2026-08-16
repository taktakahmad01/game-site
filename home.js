const GameHome = {

  init() {

    this.avatar =
      document.getElementById(
        "homeAvatar"
      );

    this.username =
      document.getElementById(
        "homeUsername"
      );

    this.country =
      document.getElementById(
        "homeCountry"
      );

    this.wins =
      document.getElementById(
        "homeWins"
      );


    /*
     * إلا Profile كان واجد قبل
     * Home initialization
     */
    if (
      typeof PlayerProfile !==
      "undefined"
    ) {

      const profile =
        PlayerProfile.getProfile();

      if (profile) {
        this.render(profile);
      }

    }


    /*
     * إلا Profile تسجّل دابا
     */
    window.addEventListener(
      "playerProfileReady",
      (event) => {

        this.render(
          event.detail.profile
        );

      }
    );

  },


  render(profile) {

    if (!profile) {
      return;
    }


    if (this.avatar) {

      this.avatar.textContent =
        profile.avatar || "👦";

    }


    if (this.username) {

      this.username.textContent =
        profile.username || "Player";

    }


    if (this.country) {

      this.country.textContent =
        this.formatCountry(
          profile.country
        );

    }


    if (this.wins) {

      this.wins.textContent =
        Number(profile.wins || 0);

    }

  },


  formatCountry(country) {

    const countries = {

      "Morocco":
        "🇲🇦 Morocco",

      "Algeria":
        "🇩🇿 Algeria",

      "Tunisia":
        "🇹🇳 Tunisia",

      "Egypt":
        "🇪🇬 Egypt",

      "Saudi Arabia":
        "🇸🇦 Saudi Arabia",

      "UAE":
        "🇦🇪 UAE",

      "Qatar":
        "🇶🇦 Qatar",

      "Other":
        "🌍 Other"

    };


    return (
      countries[country] ||
      "🌍 " + country
    );

  }

};


document.addEventListener(
  "DOMContentLoaded",
  () => {

    GameHome.init();

  }
);
