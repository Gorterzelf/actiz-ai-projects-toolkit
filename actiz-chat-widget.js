/**
 * ActiZ AI Projects Gids — Chat Widget
 * 
 * Gebruik: voeg onderaan je HTML toe, vóór </body>:
 * <script src="actiz-chat-widget.js"></script>
 * 
 * Pas de API_URL aan naar jouw Vercel deployment URL.
 */

(function () {
  // ─── CONFIG ───────────────────────────────────────────────────────────────
  const API_URL = "https://actiz-chat-api.vercel.app/api/chat";
  // Pas dit aan! Vervang JOUW-PROJECT door je echte Vercel project naam.

  const VOORBEELDVRAGEN = [
    "Wanneer maak ik een Project aan?",
    "Waarom niet gewoon losse chats gebruiken?",
    "Wat is een handover?",
    "Welke documenten mag ik uploaden?",
    "Wat mag ik absoluut niet uploaden?",
  ];

  const WELKOMSTBERICHT =
    "Hoi! Ik ben de ActiZ AI Projects Gids. Ik help je op weg met de AI Projects-werkwijze bij ActiZ. Wat wil je weten?";

  // ─── STATE ────────────────────────────────────────────────────────────────
  let isOpen = false;
  let isLoading = false;
  let conversationHistory = [];

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&display=swap');

    #actiz-chat-widget * {
      box-sizing: border-box;
      font-family: 'Barlow', 'Verdana', sans-serif;
      margin: 0;
      padding: 0;
    }

    /* ── Floating button ── */
    #actiz-chat-toggle {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 60px;
      height: 60px;
      background: #3d0a85;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(61,10,133,0.4);
      z-index: 9999;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    #actiz-chat-toggle:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 24px rgba(61,10,133,0.5);
    }

    #actiz-chat-toggle svg {
      transition: opacity 0.15s ease;
    }

    /* Pulse ring als widget gesloten is */
    #actiz-chat-toggle::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: #3d0a85;
      opacity: 0;
      animation: actiz-pulse 2.5s ease-out infinite;
    }

    @keyframes actiz-pulse {
      0%   { transform: scale(1);   opacity: 0.5; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* ── Chat venster ── */
    #actiz-chat-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      width: 360px;
      max-height: 560px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      z-index: 9998;
      overflow: hidden;
      transform: translateY(12px) scale(0.97);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.22s cubic-bezier(.34,1.36,.64,1), opacity 0.18s ease;
    }

    #actiz-chat-window.actiz-open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: all;
    }

    /* ── Header ── */
    #actiz-chat-header {
      background: #3d0a85;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    #actiz-avatar-dot {
      width: 38px;
      height: 38px;
      background: #f9b000;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
    }

    #actiz-chat-title {
      flex: 1;
    }

    #actiz-chat-title strong {
      color: #ffffff;
      font-size: 14px;
      font-weight: 600;
      display: block;
      line-height: 1.2;
    }

    #actiz-chat-title span {
      color: rgba(255,255,255,0.65);
      font-size: 12px;
    }

    #actiz-chat-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      display: flex;
    }

    #actiz-chat-close:hover {
      color: #fff;
      background: rgba(255,255,255,0.15);
    }

    /* ── Berichten ── */
    #actiz-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }

    #actiz-chat-messages::-webkit-scrollbar { width: 4px; }
    #actiz-chat-messages::-webkit-scrollbar-thumb { background: #e0d5f0; border-radius: 4px; }

    .actiz-msg {
      max-width: 86%;
      padding: 10px 13px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.5;
      animation: actiz-msgIn 0.18s ease;
    }

    @keyframes actiz-msgIn {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .actiz-msg-assistant {
      background: #f4f0fa;
      color: #1a1a2e;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }

    .actiz-msg-user {
      background: #3d0a85;
      color: #ffffff;
      border-bottom-right-radius: 4px;
      align-self: flex-end;
    }

    /* Typing indicator */
    .actiz-typing {
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 12px 14px;
      background: #f4f0fa;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      align-self: flex-start;
    }

    .actiz-typing span {
      width: 7px;
      height: 7px;
      background: #9c6fd6;
      border-radius: 50%;
      animation: actiz-bounce 1.2s infinite ease-in-out;
    }

    .actiz-typing span:nth-child(2) { animation-delay: 0.15s; }
    .actiz-typing span:nth-child(3) { animation-delay: 0.3s; }

    @keyframes actiz-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
      40%           { transform: translateY(-5px); opacity: 1; }
    }

    /* ── Voorbeeldvragen ── */
    #actiz-suggestions {
      padding: 0 16px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }

    .actiz-suggestion {
      background: none;
      border: 1px solid #e0d5f0;
      border-radius: 8px;
      padding: 7px 11px;
      font-size: 12.5px;
      color: #3d0a85;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, border-color 0.15s;
      font-family: inherit;
    }

    .actiz-suggestion:hover {
      background: #f4f0fa;
      border-color: #9c6fd6;
    }

    /* ── Invoer ── */
    #actiz-chat-inputarea {
      padding: 12px 14px;
      border-top: 1px solid #ede8f5;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
    }

    #actiz-chat-input {
      flex: 1;
      border: 1.5px solid #e0d5f0;
      border-radius: 10px;
      padding: 9px 12px;
      font-size: 13.5px;
      font-family: inherit;
      resize: none;
      outline: none;
      max-height: 90px;
      color: #1a1a2e;
      transition: border-color 0.15s;
      line-height: 1.4;
    }

    #actiz-chat-input:focus {
      border-color: #3d0a85;
    }

    #actiz-chat-input::placeholder {
      color: #aaa;
    }

    #actiz-chat-send {
      width: 36px;
      height: 36px;
      background: #f9b000;
      border: none;
      border-radius: 9px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, transform 0.1s;
    }

    #actiz-chat-send:hover {
      background: #e5a200;
    }

    #actiz-chat-send:active {
      transform: scale(0.93);
    }

    #actiz-chat-send:disabled {
      background: #e0d5f0;
      cursor: not-allowed;
    }

    /* ── Disclaimer ── */
    #actiz-disclaimer {
      padding: 6px 16px 10px;
      font-size: 11px;
      color: #aaa;
      text-align: center;
      line-height: 1.4;
      flex-shrink: 0;
    }

    /* ── Mobile ── */
    @media (max-width: 440px) {
      #actiz-chat-window {
        right: 12px;
        left: 12px;
        width: auto;
        bottom: 88px;
      }
      #actiz-chat-toggle {
        right: 16px;
        bottom: 20px;
      }
    }
  `;

  // ─── HTML ──────────────────────────────────────────────────────────────────
  function buildHTML() {
    const container = document.createElement("div");
    container.id = "actiz-chat-widget";

    const suggestieHTML = VOORBEELDVRAGEN.map(
      (v) => `<button class="actiz-suggestion">${v}</button>`
    ).join("");

    container.innerHTML = `
      <button id="actiz-chat-toggle" aria-label="Open AI Projects Gids" title="Open AI Projects Gids">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <div id="actiz-chat-window" role="dialog" aria-label="ActiZ AI Projects Gids">
        <div id="actiz-chat-header">
          <div id="actiz-avatar-dot">🧭</div>
          <div id="actiz-chat-title">
            <strong>AI Projects Gids</strong>
            <span>ActiZ · Digitaal Denken en Doen</span>
          </div>
          <button id="actiz-chat-close" aria-label="Sluit chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div id="actiz-chat-messages"></div>

        <div id="actiz-suggestions">
          ${suggestieHTML}
        </div>

        <div id="actiz-chat-inputarea">
          <textarea
            id="actiz-chat-input"
            placeholder="Stel een vraag over AI Projects…"
            rows="1"
            aria-label="Typ je vraag"
          ></textarea>
          <button id="actiz-chat-send" aria-label="Verstuur">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>

        <div id="actiz-disclaimer">
          Geen juridisch of beleidsadvies · Upload geen persoonsgegevens
        </div>
      </div>
    `;

    return container;
  }

  // ─── LOGICA ───────────────────────────────────────────────────────────────
  function addMessage(role, text) {
    const messagesEl = document.getElementById("actiz-chat-messages");
    const div = document.createElement("div");
    div.className = `actiz-msg actiz-msg-${role}`;
    // Eenvoudige markdown: **vet** en newlines
    div.innerHTML = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function showTyping() {
    const messagesEl = document.getElementById("actiz-chat-messages");
    const div = document.createElement("div");
    div.className = "actiz-typing";
    div.id = "actiz-typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    document.getElementById("actiz-typing-indicator")?.remove();
  }

  function hideSuggestions() {
    const s = document.getElementById("actiz-suggestions");
    if (s) s.style.display = "none";
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;

    hideSuggestions();
    addMessage("user", text);
    conversationHistory.push({ role: "user", content: text });

    const input = document.getElementById("actiz-chat-input");
    const sendBtn = document.getElementById("actiz-chat-send");
    input.value = "";
    input.style.height = "auto";
    isLoading = true;
    sendBtn.disabled = true;

    showTyping();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversationHistory }),
      });

      hideTyping();

      if (!res.ok) throw new Error("API-fout");

      const data = await res.json();
      const reply = data.reply || "Er ging iets mis. Probeer het opnieuw.";

      addMessage("assistant", reply);
      conversationHistory.push({ role: "assistant", content: reply });
    } catch (err) {
      hideTyping();
      addMessage(
        "assistant",
        "Oeps, er ging iets mis. Controleer de verbinding en probeer het opnieuw."
      );
    }

    isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }

  // ─── INITIALISATIE ────────────────────────────────────────────────────────
  function init() {
    // Styles injecteren
    const styleEl = document.createElement("style");
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    // HTML injecteren
    const widget = buildHTML();
    document.body.appendChild(widget);

    // Toggle button
    document.getElementById("actiz-chat-toggle").addEventListener("click", () => {
      isOpen = !isOpen;
      document.getElementById("actiz-chat-window").classList.toggle("actiz-open", isOpen);
      if (isOpen && conversationHistory.length === 0) {
        addMessage("assistant", WELKOMSTBERICHT);
        conversationHistory.push({ role: "assistant", content: WELKOMSTBERICHT });
      }
      if (isOpen) {
        setTimeout(() => document.getElementById("actiz-chat-input").focus(), 250);
      }
    });

    // Sluit knop
    document.getElementById("actiz-chat-close").addEventListener("click", () => {
      isOpen = false;
      document.getElementById("actiz-chat-window").classList.remove("actiz-open");
    });

    // Verstuur knop
    document.getElementById("actiz-chat-send").addEventListener("click", () => {
      sendMessage(document.getElementById("actiz-chat-input").value);
    });

    // Enter (shift+enter = newline)
    document.getElementById("actiz-chat-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e.target.value);
      }
    });

    // Auto-resize textarea
    document.getElementById("actiz-chat-input").addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = Math.min(this.scrollHeight, 90) + "px";
    });

    // Voorbeeldvragen
    document.querySelectorAll(".actiz-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        sendMessage(btn.textContent);
      });
    });
  }

  // Wacht op DOM
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
