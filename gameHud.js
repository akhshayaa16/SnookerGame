/* =========================================================
   gameHud.js — Fine Billiards in-game HUD (HTML overlay)
   - Reuses the CSS variables from introScreen.js (:root)
   - Minimal: Mode, State, Power
========================================================= */

var _hud = {
    root: null,
    modeEl: null,
    stateEl: null,
    powerEl: null,
    powerFill: null
};

function gameHudInit() {
    if (document.getElementById("fbHud")) return;

    // ---------- CSS ----------
    var style = document.createElement("style");
    style.id = "fbHudStyles";
    style.textContent = `
  #fbHud{
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 2000; /* below intro overlay (9999), above canvas */
    font-family: "FB-Inter", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  }

  .fbHudWrap{
    position: absolute;
    left: 18px;
    top: 18px;
    display: grid;
    gap: 10px;
  }

  .fbHudCard{
    width: min(380px, calc(100vw - 36px));
    border-radius: 14px;
    padding: 12px 14px;
    background: rgba(239,229,209,0.82); /* parchment */
    border: 1px solid rgba(0,0,0,0.18);
    box-shadow: 0 14px 30px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.55);
    backdrop-filter: blur(8px);
  }

  .fbHudTitle{
    font-family: "FB-Cinzel", serif;
    letter-spacing: .12em;
    text-transform: uppercase;
    font-size: 12px;
    color: rgba(22,19,17,0.82);
    margin: 0 0 8px 0;
  }

  .fbHudRow{
    display: grid;
    grid-template-columns: 84px 1fr;
    gap: 10px;
    align-items: center;
    font-size: 13px;
    color: rgba(22,19,17,0.82);
  }

  .fbHudKey{
    font-family: "FB-Cinzel", serif;
    letter-spacing: .10em;
    text-transform: uppercase;
    font-size: 11px;
    color: rgba(22,19,17,0.70);
  }

  .fbPill{
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,0.55);
    border: 1px solid rgba(0,0,0,0.14);
    width: fit-content;
  }

  .fbPowerBar{
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(0,0,0,0.18);
    border: 1px solid rgba(0,0,0,0.12);
  }

  .fbPowerFill{
    height: 100%;
    width: 0%;
    background: linear-gradient(180deg, rgba(232,208,138,.95), rgba(201,162,79,.90));
    border-radius: 999px;
  }

  .fbHudSmall{
    font-size: 12px;
    color: rgba(22,19,17,0.72);
  }
  `;
    document.head.appendChild(style);

    // ---------- DOM ----------
    var root = document.createElement("div");
    root.id = "fbHud";
    root.innerHTML = `
    <div class="fbHudWrap">
      <div class="fbHudCard">
        <div class="fbHudTitle">Fine Billiards</div>

        <div class="fbHudRow">
          <div class="fbHudKey">Mode</div>
          <div class="fbPill"><span id="fbHudMode">1</span></div>
        </div>

        <div class="fbHudRow" style="margin-top:6px;">
          <div class="fbHudKey">State</div>
          <div class="fbPill"><span id="fbHudState">idle</span></div>
        </div>

        <div class="fbHudRow" style="margin-top:10px;">
          <div class="fbHudKey">Power</div>
          <div>
            <div class="fbPowerBar">
              <div class="fbPowerFill" id="fbHudPowerFill"></div>
            </div>
            <div class="fbHudSmall" style="margin-top:6px;">
              <span id="fbHudPower">0</span>%
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(root);

    _hud.root = root;
    _hud.modeEl = document.getElementById("fbHudMode");
    _hud.stateEl = document.getElementById("fbHudState");
    _hud.powerEl = document.getElementById("fbHudPower");
    _hud.powerFill = document.getElementById("fbHudPowerFill");

    gameHudShow(false); // hidden until game starts
}

function gameHudShow(show) {
    if (!_hud.root) return;
    _hud.root.style.display = show ? "block" : "none";
}

function gameHudUpdate(mode, state, power01) {
    if (!_hud.root) return;

    if (_hud.modeEl) _hud.modeEl.textContent = String(mode);
    if (_hud.stateEl) _hud.stateEl.textContent = String(state);

    var p = Math.max(0, Math.min(1, power01 || 0));
    var pct = Math.round(p * 100);

    if (_hud.powerEl) _hud.powerEl.textContent = String(pct);
    if (_hud.powerFill) _hud.powerFill.style.width = pct + "%";
}
