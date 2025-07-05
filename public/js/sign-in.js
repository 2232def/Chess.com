let signInDiv = document.getElementById("clerk-signin");
window.addEventListener("load", async () => {
  // Wait for Clerk to load
  await window.Clerk.load();

  window.Clerk.mountSignIn(signInDiv, {
    redirectUrl: "/play",
    signInUrl: "/sign-in",
  });
});
