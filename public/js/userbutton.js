async function initializeUserButton() {
  // Wait for Clerk to be available
  if (!window.Clerk) {
    console.error('Clerk not loaded');
    return;
  }

  await window.Clerk.load();


    document.getElementById('app').innerHTML = `
      <div id="user-button"></div>
    `;

    const userButtonDiv = document.getElementById('user-button');
    window.Clerk.mountUserButton(userButtonDiv);
}

// Initialize when page loads
window.addEventListener('load', initializeUserButton);