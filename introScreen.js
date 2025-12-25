/* =========================================================
   introScreen.js — Fine Billiards (HTML Overlay Intro)
   - Uses HTML overlay for intro screens (closed -> welcome -> menu)
   - Responsive and non-overlapping layouts
   - Cinematic spotlight + grain + dust background (from your preferred version)

   Requires in sketch.js:
   - global var appScreen = "intro" | "game"
   - window.startGameWithMode(mode) exists
   - canvas has id="gameCanvas"
========================================================= */

var introState = "closed"; // "closed" | "welcome" | "menu"
var introSelectedMode = 1;

var _intro = {
    root: null,
    paper: null,
    sealWrap: null,
    seal: null,
    btnEnter: null,
    btnStart: null,
    modeCards: [],
};

function introInit() {
    if (document.getElementById("fbOverlay")) return;

    // ---------- CSS ----------
    var style = document.createElement("style");
    style.id = "fbStyles";
    style.textContent = `
  :root{
    --bg0:#070606;
    --bg1:#0f0b0a;
    --gold:#c9a24f;
    --gold2:#e8d08a;
    --paper:#efe5d1;
    --paper2:#e7dcc7;
    --ink:#161311;
    --muted:#6f6255;

    /* Scroll size */
    --paperW: min(1120px, 94vw);
    --paperHClosed: clamp(110px, 14vh, 150px);
    --paperHWelcome: clamp(260px, 42vh, 360px);
    --paperHMenu: min(660px, 88vh);

    --pad: clamp(18px, 2.2vw, 30px);
    --gap: clamp(14px, 2vw, 22px);

    /* Typography (bigger for menu readability) */
    --titleSize: clamp(28px, 3.2vw, 46px);
    --tagSize: clamp(10px, 1.0vw, 12px);

    --welcomeSize: clamp(32px, 4.0vw, 62px);
    --bodySize: clamp(14px, 1.15vw, 16px);
    --panelTitle: clamp(13px, 1.15vw, 14px);

    --btnSize: clamp(13px, 1.2vw, 15px);

    --sealSize: clamp(92px, 10vw, 132px);
  }

  @font-face{
    font-family: "FB-Cinzel";
    src: url("fonts/Cinzel-VariableFont_wght.ttf") format("truetype");
    font-display: swap;
  }
  @font-face{
    font-family: "FB-Inter";
    src: url("fonts/Inter-VariableFont_opsz,wght.ttf") format("truetype");
    font-display: swap;
  }

  #fbOverlay{
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    overflow: hidden;
    font-family: "FB-Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: var(--ink);
  }

  /* Cinematic background (spotlight + subtle green tint + grain + dust) */
  #fbOverlay::before{
    content:"";
    position:absolute; inset:-10%;
    background:
      radial-gradient(1200px 600px at 55% 35%, rgba(224,184,90,.18), transparent 60%),
      radial-gradient(900px 500px at 45% 70%, rgba(12,90,55,.22), transparent 62%),
      radial-gradient(900px 900px at 40% 40%, rgba(255,255,255,.06), transparent 55%),
      linear-gradient(135deg, var(--bg0), var(--bg1));
    filter: saturate(1.05) contrast(1.05);
    animation: fbSpot 7s ease-in-out infinite alternate;
  }
  @keyframes fbSpot{
    0%{ transform: translate3d(-1.5%, -1%, 0) scale(1.02); }
    100%{ transform: translate3d(1.2%, 1.4%, 0) scale(1.04); }
  }

  /* Grain overlay */
  #fbOverlay::after{
    content:"";
    position:absolute; inset:0;
    background:
      radial-gradient(transparent 55%, rgba(0,0,0,.70) 90%),
      repeating-linear-gradient(0deg, rgba(255,255,255,.03), rgba(255,255,255,.03) 1px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px);
    mix-blend-mode: overlay;
    opacity:.25;
    pointer-events:none;
    animation: fbGrain 0.7s steps(2) infinite;
  }
  @keyframes fbGrain{
    0%{ transform: translate(0,0); }
    100%{ transform: translate(-1.5%, 1.2%); }
  }

  /* Dust */
  .fbDust{
    position:absolute; inset:0;
    pointer-events:none;
    opacity: .22;
    background:
      radial-gradient(circle at 15% 25%, rgba(255,255,255,.35) 0 1px, transparent 2px),
      radial-gradient(circle at 75% 45%, rgba(255,255,255,.30) 0 1px, transparent 2px),
      radial-gradient(circle at 55% 65%, rgba(255,255,255,.25) 0 1px, transparent 2px),
      radial-gradient(circle at 35% 75%, rgba(255,255,255,.25) 0 1px, transparent 2px);
    background-size: 420px 420px;
    animation: fbDustFloat 9s ease-in-out infinite alternate;
  }
  @keyframes fbDustFloat{
    0%{ transform: translate3d(-1%, -1%, 0); }
    100%{ transform: translate3d(1.5%, 1.2%, 0); }
  }

  /* Center wrapper */
  .fbCenter{
    position: relative;
    width: var(--paperW);
    display: grid;
    place-items: center;
    filter: drop-shadow(0 28px 60px rgba(0,0,0,.55));
  }

  /* Scroll rollers */
  .fbRoll{
    position:absolute;
    left: 50%;
    transform: translateX(-50%);
    width: calc(var(--paperW) * 0.94);
    height: clamp(42px, 6vh, 58px);
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(10,8,7,.95), rgba(0,0,0,.88));
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.06),
      inset 0 -1px 0 rgba(255,255,255,.04),
      0 14px 28px rgba(0,0,0,.55);
    border: 1px solid rgba(201,162,79,.35);
    opacity: .96;
  }
  .fbRoll.top{ top: -18px; }
  .fbRoll.bottom{ bottom: -18px; }

  /* Paper */
  .fbPaper{
    position: relative;
    width: var(--paperW);
    height: var(--paperHClosed);
    border-radius: 18px;
    background:
      radial-gradient(900px 520px at 18% 0%, rgba(255,255,255,.44), transparent 58%),
      radial-gradient(700px 420px at 82% 105%, rgba(0,0,0,.07), transparent 56%),
      linear-gradient(180deg, var(--paper), var(--paper2));
    border: 1px solid rgba(0,0,0,.10);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.62),
      inset 0 -10px 30px rgba(0,0,0,.07);
    overflow: hidden;
    transition: height 820ms cubic-bezier(.18,.98,.20,1), transform 820ms cubic-bezier(.18,.98,.20,1);
  }

  /* A clean inner safe-area wrapper */
  .fbInner{
    padding: var(--pad);
    height: 100%;
    display: grid;
    min-height: 0;
  }

  /* ===== State blocks ===== */
  .fbState{
    display: none;
    height: 100%;
    min-height: 0;
  }
  .fbPaper.state-closed .fbStateClosed{ display: grid; }
  .fbPaper.state-welcome .fbStateWelcome{ display: grid; }
  .fbPaper.state-menu .fbStateMenu{ display: grid; }

  /* ===== CLOSED ===== */
  .fbStateClosed{
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 18px;
  }
  .fbBrand{
    display:flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .fbTitle{
    font-family: "FB-Cinzel", serif;
    font-size: var(--titleSize);
    letter-spacing: .08em;
    text-transform: uppercase;
    margin: 0;
    line-height: 1.05;
  }
  .fbTag{
    justify-self: end;
    font-size: var(--tagSize);
    letter-spacing: .22em;
    text-transform: uppercase;
    color: rgba(22,19,17,.70);
    border: 1px solid rgba(0,0,0,.12);
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(255,255,255,.40);
    white-space: nowrap;
  }
  .fbHint{
    position: absolute;
    left: 50%;
    bottom: -44px;
    transform: translateX(-50%);
    font-size: clamp(11px, 1.05vw, 12px);
    color: rgba(255,255,255,.70);
    letter-spacing: .14em;
    text-transform: uppercase;
    white-space: nowrap;
    pointer-events:none;
  }

  /* ===== WELCOME ===== */
  .fbStateWelcome{
    place-items: center;
    text-align: center;
  }
  .fbWelcomeWrap{
    display:grid;
    place-items:center;
    gap: 18px;
    max-width: min(920px, 90%);
  }
  .fbWelcomeTitle{
    font-family: "FB-Cinzel", serif;
    font-size: var(--welcomeSize);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin: 0;
    line-height: 1.05;
    color: rgba(22,19,17,.95);
  }
  .fbWelcomeBtnRow{
    display:flex;
    justify-content:center;
  }

  /* ===== MENU ===== */
  .fbStateMenu{
    grid-template-rows: auto 1fr;
    gap: var(--gap);
    min-height: 0;
  }
  .fbMenuHeader{
    display:flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
  }
  .fbMenuHeader h2{
    margin:0;
    font-family: "FB-Cinzel", serif;
    letter-spacing: .10em;
    text-transform: uppercase;
    font-size: clamp(16px, 1.4vw, 18px);
    color: rgba(22,19,17,.82);
  }

  .fbMenuScroll{
    min-height: 0;
    overflow: auto;
    padding-right: 6px;
  }
  .fbMenuScroll::-webkit-scrollbar{ width: 10px; }
  .fbMenuScroll::-webkit-scrollbar-thumb{
    background: rgba(0,0,0,.16);
    border-radius: 999px;
    border: 2px solid rgba(255,255,255,.35);
  }

  .fbBody{
    display:grid;
    grid-template-columns: 1.2fr 1fr;
    gap: var(--gap);
    align-items: start;
  }

  .fbPanel{
    background: rgba(255,255,255,.26);
    border: 1px solid rgba(0,0,0,.10);
    border-radius: 14px;
    padding: clamp(16px, 2vw, 20px);
    box-shadow: inset 0 1px 0 rgba(255,255,255,.40);
    min-height: 0;
  }
  .fbPanel h3{
    margin: 0 0 12px 0;
    font-family: "FB-Cinzel", serif;
    letter-spacing: .10em;
    text-transform: uppercase;
    font-size: var(--panelTitle);
    color: rgba(22,19,17,.85);
  }

  .fbQuickRow{
    display:grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 12px;
  }
  .fbCard{
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.10);
    background: rgba(255,255,255,.60);
    padding: 14px;
    min-height: 124px;
    display:flex;
    flex-direction: column;
    gap: 10px;
  }
  .fbKey{
    display:inline-flex;
    align-items:center;
    justify-content:center;
    font-weight: 650;
    font-size: 12px;
    letter-spacing: .14em;
    text-transform: uppercase;
    padding: 7px 10px;
    border-radius: 10px;
    border: 1px solid rgba(0,0,0,.14);
    background: rgba(255,255,255,.72);
    width: fit-content;
  }
  .fbCard b{
    font-size: 12px;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(22,19,17,.85);
  }
  .fbCard p{
    margin: 0;
    font-size: var(--bodySize);
    color: rgba(22,19,17,.72);
    line-height: 1.35;
  }

  .fbModes{
    display:flex;
    flex-direction: column;
    gap: 10px;
  }
  .fbMode{
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.12);
    background: rgba(255,255,255,.60);
    padding: 14px 14px;
    cursor:pointer;
    transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
  }
  .fbMode:hover{
    transform: translateY(-1px);
    box-shadow: 0 10px 22px rgba(0,0,0,.18);
    border-color: rgba(201,162,79,.55);
  }
  @media (hover: none){
    .fbMode:hover{ transform:none; box-shadow:none; border-color: rgba(0,0,0,.12); }
  }
  .fbModeTitle{
    font-family: "FB-Cinzel", serif;
    letter-spacing: .10em;
    text-transform: uppercase;
    font-size: clamp(13px, 1.2vw, 14px);
    margin: 0;
  }
  .fbModeDesc{
    margin: 6px 0 0 0;
    font-size: var(--bodySize);
    color: rgba(22,19,17,.70);
    line-height: 1.25;
  }
  .fbMode.selected{
    border-color: rgba(201,162,79,.85);
    box-shadow: inset 0 0 0 1px rgba(201,162,79,.40);
    background: rgba(255,255,255,.72);
  }

  .fbFooter{
    display:flex;
    align-items:flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-top: 12px;
    color: rgba(22,19,17,.62);
    font-size: clamp(11px, 1.05vw, 12px);
  }

  .fbBtn{
    border: none;
    cursor: pointer;
    font-family: "FB-Cinzel", serif;
    letter-spacing: .14em;
    text-transform: uppercase;
    font-size: var(--btnSize);
    padding: 12px 16px;
    border-radius: 999px;
    color: rgba(22,19,17,.95);
    background: linear-gradient(180deg, rgba(232,208,138,.95), rgba(201,162,79,.90));
    box-shadow: 0 12px 24px rgba(0,0,0,.25);
    border: 1px solid rgba(0,0,0,.16);
    white-space: nowrap;
  }
  .fbBtn:active{ transform: translateY(1px); }

  .fbBtn.bob{
    animation: fbBob 1.4s ease-in-out infinite;
  }
  @keyframes fbBob{
    0%,100%{ transform: translateY(0); }
    50%{ transform: translateY(-4px); }
  }

  /* ===== Seal (only visible in CLOSED) ===== */
  .fbSealWrap{
    position:absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -14%);
    width: var(--sealSize);
    height: var(--sealSize);
    display:grid;
    place-items: center;
    z-index: 5;
    pointer-events: auto;
    transition: opacity 320ms ease, transform 320ms ease;
  }

  .fbSeal{
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba(0,0,0,.22);
    background:
      radial-gradient(circle at 30% 25%, rgba(255,255,255,.22), transparent 45%),
      radial-gradient(circle at 60% 70%, rgba(0,0,0,.18), transparent 55%),
      linear-gradient(180deg, #7a1215, #4f0c0e);
    box-shadow:
      0 22px 40px rgba(0,0,0,.45),
      inset 0 1px 0 rgba(255,255,255,.20),
      inset 0 -10px 18px rgba(0,0,0,.22);
    position: relative;
    cursor: pointer;
    transform: rotate(-2deg);
    transition: transform 220ms ease;
  }
  .fbSeal:hover{ transform: rotate(-2deg) scale(1.02); }
  @media (hover: none){
    .fbSeal:hover{ transform: rotate(-2deg); }
  }

  .fbSeal::before{
    content:"";
    position:absolute;
    inset: 10%;
    border-radius: 50%;
    border: 2px solid rgba(232,208,138,.85);
    box-shadow: inset 0 0 0 2px rgba(201,162,79,.35);
  }
  .fbSeal::after{
    content:"♛";
    position:absolute;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    font-size: clamp(14px, 1.6vw, 18px);
    color: rgba(232,208,138,.92);
    text-shadow: 0 2px 0 rgba(0,0,0,.35);
  }
  .fbSealMark{
    position:absolute;
    inset: 0;
    display:grid;
    place-items:center;
    font-family: "FB-Cinzel", serif;
    letter-spacing: .16em;
    color: rgba(232,208,138,.92);
    text-shadow: 0 2px 0 rgba(0,0,0,.35);
    font-weight: 700;
    font-size: clamp(16px, 2vw, 22px);
  }

  /* Hide seal in welcome/menu (no leftovers) */
  .fbPaper.state-welcome .fbSealWrap,
  .fbPaper.state-menu .fbSealWrap{
    opacity: 0;
    pointer-events: none;
    transform: translate(-50%, -20%) scale(.98);
  }

  /* Responsive collapse */
  @media (max-width: 980px){
    .fbBody{ grid-template-columns: 1fr; }
    .fbQuickRow{ grid-template-columns: 1fr; }
    :root{ --paperHMenu: min(720px, 90vh); }
  }

  /* Hide overlay */
  #fbOverlay.hidden{
    opacity: 0;
    pointer-events: none;
    transition: opacity 280ms ease;
  }
  `;
    document.head.appendChild(style);

    // ---------- DOM ----------
    var overlay = document.createElement("div");
    overlay.id = "fbOverlay";
    overlay.innerHTML = `
    <div class="fbDust"></div>

    <div class="fbCenter">
      <div class="fbRoll top"></div>
      <div class="fbRoll bottom"></div>

      <div class="fbPaper state-closed" id="fbPaper">
        <div class="fbInner">

          <!-- CLOSED -->
          <div class="fbState fbStateClosed">
            <div class="fbBrand">
              <h1 class="fbTitle">Fine Billiards</h1>
            </div>
            <div class="fbTag">Members Only · By Invitation</div>
          </div>

          <!-- WELCOME (no Fine Billiards, no seal) -->
          <div class="fbState fbStateWelcome">
            <div class="fbWelcomeWrap">
              <div class="fbTag" style="justify-self:center;">Members Only · By Invitation</div>
              <h1 class="fbWelcomeTitle">Welcome to a game of English Billiards</h1>
              <div class="fbWelcomeBtnRow">
                <button class="fbBtn bob" id="fbEnterBtn">Enter the Den</button>
              </div>
            </div>
          </div>

          <!-- MENU -->
          <div class="fbState fbStateMenu">
            <div class="fbMenuHeader">
              <h2>How to play & choose your table</h2>
              <div class="fbTag">Members Only · By Invitation</div>
            </div>

            <div class="fbMenuScroll" id="fbMenuScroll">
              <div class="fbBody">
                <div class="fbPanel">
                  <h3>How to play </h3>
                  <div class="fbQuickRow">
                    <div class="fbCard">
                      <span class="fbKey">C</span>
                      <b>Place</b>
                      <p>Place the cue ball inside the D. Click to confirm.</p>
                    </div>
                    <div class="fbCard">
                      <span class="fbKey">Mouse + Arrows</span>
                      <b>Aim</b>
                      <p>Mouse aims. UP/DOWN sets power. LEFT/RIGHT fine-adjusts angle. SHIFT = fine steps.</p>
                    </div>
                    <div class="fbCard">
                      <span class="fbKey">Space</span>
                      <b>Strike</b>
                      <p>A single impulse — no rubber-band cue. Wait for balls to settle.</p>
                    </div>
                  </div>

                  <div class="fbFooter">
                    <div>Modes: press <b>1</b>/<b>2</b>/<b>3</b> anytime, or click a card.</div>
                  </div>
                </div>

                <div class="fbPanel">
                  <h3>Choose your table</h3>
                  <div class="fbModes">
                    <div class="fbMode" data-mode="1">
                      <p class="fbModeTitle">Mode 1 — Classic Break</p>
                      <p class="fbModeDesc">Full setup: colours + reds triangle.</p>
                    </div>
                    <div class="fbMode" data-mode="2">
                      <p class="fbModeTitle">Mode 2 — Red Clusters</p>
                      <p class="fbModeDesc">Three red clusters for pattern shots.</p>
                    </div>
                    <div class="fbMode" data-mode="3">
                      <p class="fbModeTitle">Mode 3 — Practice Drill</p>
                      <p class="fbModeDesc">T-shape drill to train control.</p>
                    </div>
                  </div>

                  <div class="fbFooter">
                    <div>Keyboard: <b>1</b>/<b>2</b>/<b>3</b> to choose, <b>Enter</b> to start.</div>
                    <button class="fbBtn" id="fbStartBtn">Start Game</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Seal (ONLY in CLOSED) -->
          <div class="fbSealWrap" id="fbSealWrap">
            <div class="fbSeal" id="fbSeal">
              <div class="fbSealMark">FB</div>
            </div>
          </div>

        </div>
      </div>

      <div class="fbHint" id="fbHint">Click the seal · or press Enter</div>
    </div>
  `;
    document.body.appendChild(overlay);

    // Cache refs
    _intro.root = overlay;
    _intro.paper = document.getElementById("fbPaper");
    _intro.sealWrap = document.getElementById("fbSealWrap");
    _intro.seal = document.getElementById("fbSeal");
    _intro.btnEnter = document.getElementById("fbEnterBtn");
    _intro.btnStart = document.getElementById("fbStartBtn");
    _intro.modeCards = Array.from(document.querySelectorAll(".fbMode"));
    _intro.hint = document.getElementById("fbHint");

    introSetState("closed");
    introSelectMode(1);

    // interactions
    _intro.seal.addEventListener("click", function () {
        if (introState === "closed") introSetState("welcome");
    });

    _intro.btnEnter.addEventListener("click", function () {
        introSetState("menu");
    });

    _intro.modeCards.forEach(function (el) {
        el.addEventListener("click", function () {
            introSelectMode(parseInt(el.dataset.mode, 10));
        });
    });

    _intro.btnStart.addEventListener("click", function () {
        introStartGame();
    });

    // Hide canvas during intro
    var canvas = document.getElementById("gameCanvas");
    if (canvas) canvas.style.display = "none";
}

function introSetState(state) {
    introState = state;

    _intro.paper.classList.remove("state-closed", "state-welcome", "state-menu");
    if (state === "closed") {
        _intro.paper.classList.add("state-closed");
        _intro.paper.style.height = "var(--paperHClosed)";
        if (_intro.hint) _intro.hint.style.opacity = "1";
    }
    if (state === "welcome") {
        _intro.paper.classList.add("state-welcome");
        _intro.paper.style.height = "var(--paperHWelcome)";
        if (_intro.hint) _intro.hint.style.opacity = "0";
    }
    if (state === "menu") {
        _intro.paper.classList.add("state-menu");
        _intro.paper.style.height = "var(--paperHMenu)";
        if (_intro.hint) _intro.hint.style.opacity = "0";
    }
}

function introSelectMode(mode) {
    introSelectedMode = mode;
    _intro.modeCards.forEach(function (el) {
        var m = parseInt(el.dataset.mode, 10);
        if (m === mode) el.classList.add("selected");
        else el.classList.remove("selected");
    });
}

function introStartGame() {
    if (typeof window.startGameWithMode === "function") {
        window.startGameWithMode(introSelectedMode);
    }

    _intro.root.classList.add("hidden");

    var canvas = document.getElementById("gameCanvas");
    if (canvas) canvas.style.display = "block";
}

function introShow() {
    if (_intro.root) _intro.root.classList.remove("hidden");
}
function introHide() {
    if (_intro.root) _intro.root.classList.add("hidden");
}

/* ===== p5 compatibility hooks ===== */
function introDraw() {
    // overlay handles visuals
}

function introKeyPressed(k, kc) {
    // 1/2/3 selects mode, and gently progresses state if needed
    if (k === "1" || k === "2" || k === "3") {
        introSelectMode(parseInt(k, 10));
        if (introState === "closed") introSetState("welcome");
        if (introState === "welcome") introSetState("menu");
        return;
    }

    // ENTER: closed->welcome, welcome->menu, menu->start
    if (kc === 13) {
        if (introState === "closed") introSetState("welcome");
        else if (introState === "welcome") introSetState("menu");
        else if (introState === "menu") introStartGame();
        return;
    }

    // SPACE: welcome->menu
    if (kc === 32) {
        if (introState === "welcome") introSetState("menu");
        return;
    }
}

function introMousePressed() {
    // no-op: overlay handles clicks
}
