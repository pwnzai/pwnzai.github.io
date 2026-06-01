(() => {
  const PASSWORD = "eletie";
  const SESSION_KEY = "pg10v:authed";
  const RSVP_EMAIL = "mira.ala.kantti@gmail.com";

  const passwordInput = document.getElementById("passwordInput");
  const loginButton = document.getElementById("loginButton");
  const logoutButton = document.getElementById("logoutButton");

  const deniedDialog = document.getElementById("deniedDialog");
  const deniedOkButton = document.getElementById("deniedOkButton");

  const rsvpForm = document.getElementById("rsvpForm");
  const rsvpSubmit = document.getElementById("rsvpSubmit");

  function isAuthed() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function setAuthedFlag(isAuthedFlag) {
    if (isAuthedFlag) {
      sessionStorage.setItem(SESSION_KEY, "1");
      return;
    }
    sessionStorage.removeItem(SESSION_KEY);
  }

  function openDeniedModal() {
    if (typeof deniedDialog?.showModal === "function") {
      deniedDialog.showModal();
      return;
    }

    alert("ACCESS DENIED");
  }

  function closeDeniedModal() {
    if (typeof deniedDialog?.close === "function" && deniedDialog.open) {
      deniedDialog.close();
    }
  }

  function attemptLogin() {
    if (!passwordInput) return;
    const provided = String(passwordInput.value || "").trim();
    if (provided === PASSWORD) {
      setAuthedFlag(true);
      window.location.href = "content.html";
    } else {
      openDeniedModal();
      passwordInput.select();
      passwordInput.focus();
    }
  }

  function buildMailtoUrl({ firstName, lastName, rsvp, avec, souvenir, allergies }) {
    const subject = "Osallistun PG 10v juhliin!";
    const lines = [
      `Name: ${`${firstName} ${lastName}`.trim()}`,
      `Oletko tulossa?: ${rsvp}`,
      `Avec: ${avec}`,
      `Haluan PG-muistoesineen (hinta max 50€): ${souvenir}`,
      `Allergiat & ruokarajoitteet (jos on): ${allergies || ""}`,
    ];

    const body = lines.join("\n");
    const params = new URLSearchParams({
      subject,
      body,
    });

    return `mailto:${RSVP_EMAIL}?${params.toString()}`;
  }

  function getCheckedValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function handleRsvpSubmit(event) {
    event.preventDefault();

    if (!rsvpForm.checkValidity()) {
      rsvpForm.reportValidity();
      return;
    }

    const firstName = String(document.getElementById("firstName").value || "").trim();
    const lastName = String(document.getElementById("lastName").value || "").trim();
    const rsvp = getCheckedValue("rsvp");
    const avec = getCheckedValue("avec");
    const souvenir = getCheckedValue("souvenir");
    const allergies = String(document.getElementById("allergies").value || "").trim();

    // Display values (email body) in Finnish to match the form labels.
    const rsvpDisplay = rsvp === "Yes" ? "Kyllä" : rsvp === "No" ? "Ei" : rsvp;
    const avecDisplay = avec === "Yes" ? "Kyllä" : avec === "No" ? "Ei" : avec;
    const souvenirDisplay =
      souvenir === "Yes" ? "Kyllä" : souvenir === "No" ? "Ei" : souvenir;

    const mailtoUrl = buildMailtoUrl({
      firstName,
      lastName,
      rsvp: rsvpDisplay,
      avec: avecDisplay,
      souvenir: souvenirDisplay,
      allergies,
    });

    rsvpSubmit.disabled = true;
    try {
      window.location.href = mailtoUrl;
    } finally {
      window.setTimeout(() => {
        rsvpSubmit.disabled = false;
      }, 600);
    }
  }

  // Initial state
  const onLoginPage = Boolean(passwordInput && loginButton);
  const onContentPage = Boolean(document.getElementById("contentView"));

  if (onContentPage && !isAuthed()) {
    window.location.replace("index.html");
    return;
  }

  // Login interactions
  if (onLoginPage) {
    if (isAuthed()) {
      window.location.replace("content.html");
      return;
    }

    loginButton.addEventListener("click", attemptLogin);
    passwordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") attemptLogin();
    });
    passwordInput.focus();
  }

  // Logout
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      setAuthedFlag(false);
      window.location.href = "index.html";
    });
  }

  // Denied modal controls
  if (deniedOkButton) deniedOkButton.addEventListener("click", closeDeniedModal);
  if (deniedDialog) {
    deniedDialog.addEventListener("click", (e) => {
      if (e.target === deniedDialog) closeDeniedModal();
    });
  }

  // RSVP
  if (rsvpForm) rsvpForm.addEventListener("submit", handleRsvpSubmit);
})();
