const GameAuth = {

  currentUser: null,

  async init() {

    return new Promise((resolve, reject) => {

      firebase.auth().onAuthStateChanged(
        async (user) => {

          if (user) {

            this.currentUser = user;

            console.log(
              "Authenticated:",
              user.uid
            );

            resolve(user);

            return;
          }

          try {

            const credential =
              await firebase
                .auth()
                .signInAnonymously();

            this.currentUser =
              credential.user;

          } catch (error) {

            console.error(
              "Anonymous auth error:",
              error
            );

            reject(error);
          }

        }
      );

    });

  }

};
