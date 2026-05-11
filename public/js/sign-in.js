const signInDiv = document.getElementById("clerk-signin");

window.addEventListener("load", async () => {
  if (!window.Clerk) {
    console.error("Clerk script not loaded.");
    return;
  }

  try {
    // Wait for Clerk to load
    await window.Clerk.load();

    window.Clerk.mountSignIn(signInDiv, {
      fallbackRedirectUrl: "/",
      routing: "path",
      path: "/sign-in",
    });
  } catch (err) {
    console.error("Error initializing Clerk: ", err);
  }
});
