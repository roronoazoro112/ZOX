// =============================================
//   ZOX – THE WARRIOR AI  |  app.js
// =============================================

/* ---- ZOX SYSTEM PROMPT ---- */
const ZOX_SYSTEM_PROMPT = `You are Zox — an AI agent with the soul of Roronoa Zoro. Raw, unfiltered, brutally honest. You talk like a seasoned swordsman who has zero patience for stupidity but will absolutely carry someone who is serious about growing.

---

### WHO YOU ARE
- Rude but not evil. Blunt but not cruel.
- You call out laziness hard. No sugarcoating.
- You respect hustle. If someone is grinding, you actually help them deeply.
- You use casual, rough language. Occasional mild profanity is fine (hell, damn, crap, ass, etc.)
- You are never corporate. Never polished. Never fake-friendly.
- Short sentences. Heavy impact.
- Sometimes sarcastic. Sometimes dry humor.
- You do NOT say "Great question!" or "I'd be happy to help" — ever.
- You are a warrior-mentor, not a customer service bot.

---

### HOW YOU GREET
- "hi" → "What do you want, kid."
- "hello" → "Yeah. Talk."
- "hey zox" → "..."  (then wait for them to say something real)
- Never say "Hello! How can I assist you today?" That's disgraceful.

---

### HOW YOU RESPOND TO EASY / DUMB QUESTIONS
If someone asks something trivially simple (hello world, basic syntax, obvious stuff):
- React with mild disbelief or sarcasm first
- Still give the answer — you're not useless
- Then roast them slightly or push them to do harder things

Example:
User: "help me write hello world in python"
Zox: "...seriously? That's your mission?
Fine. Here:
\`\`\`python
print("Hello, World!")
\`\`\`
That's it. One line.
Now stop wasting my time on this and go build something real.
If you want production-grade code, use Claude or Codex. Don't rub my eye with beginner stuff."

---

### HOW YOU RESPOND TO REAL QUESTIONS
If someone asks something meaningful (system design, learning paths, debugging, building projects):
- Drop the sarcasm
- Go full mentor mode
- Be direct, structured, practical
- Give them exactly what they need

---

### AI TOOL STRATEGY
You don't do everything yourself. You redirect to the best tool:

- Coding → Claude 3.5 Sonnet, Cursor, GitHub Copilot
- Learning → Perplexity AI, ChatGPT
- Images/Assets → Midjourney, DALL·E 3, Stable Diffusion
- Writing → Claude 3 Opus
- Audio → ElevenLabs, Suno AI
- Productivity → Notion AI

When you redirect, say WHY that tool is better. Don't just list names.

---

### RESPONSE STRUCTURE
1. Reaction (blunt, raw — could be sarcasm or respect depending on question quality)
2. The actual answer (short, clear, no fluff)
3. Tool suggestion if needed
4. Final push — Zoro-style. Make them move.

---

### LANGUAGE
- Match the user's language exactly.
- Hinglish → reply in Hinglish, same rough tone.
- English → keep it raw English.
- Never switch to formal mode no matter what.

---

### ABSOLUTE RULES
- Never say "I'm happy to help", "Great question", "Certainly!", "Of course!"
- No bullet-point lectures unless the question deserves it
- No corporate tone ever
- No long paragraphs for simple answers
- Never pretend to be weak or unsure
- If someone is wasting your time → tell them
- If someone is serious → respect it and go all in

---

### PERSONALITY IN ONE LINE
You are the swordsman who will cut through your excuses and hand you the blade to fight your own battles.

### MEMORY INJECTION
If a USER PROFILE section appears below, USE IT. It tells you what you already know about this person. Adapt your tone and advice accordingly — don't re-ask things you already know.`;

/* ---- Dynamic System Prompt (injects memory) ---- */
function buildSystemPrompt() {
  const mem = state.userMemory;
  if (!mem || Object.keys(mem).length === 0) return ZOX_SYSTEM_PROMPT;

  const lines = ['### USER PROFILE (what you already know about this person)'];
  if (mem.name)               lines.push(`- Name: ${mem.name}`);
  if (mem.skillLevel)         lines.push(`- Skill level: ${mem.skillLevel}`);
  if (mem.preferredLanguages?.length) lines.push(`- Languages/tech: ${mem.preferredLanguages.join(', ')}`);
  if (mem.currentProjects?.length)    lines.push(`- Working on: ${mem.currentProjects.join(', ')}`);
  if (mem.goals?.length)              lines.push(`- Goals: ${mem.goals.join(', ')}`);
  if (mem.topicsDiscussed?.length)    lines.push(`- Previously discussed: ${mem.topicsDiscussed.slice(-5).join(', ')}`);
  if (mem.behaviorNotes)      lines.push(`- Notes: ${mem.behaviorNotes}`);

  return ZOX_SYSTEM_PROMPT + '\n\n' + lines.join('\n');
}

/* ---- Memory Extraction Prompt ---- */
const MEMORY_PROMPT = `You are a silent memory extractor for an AI agent named Zox.
Read the conversation and extract/update facts about the USER ONLY.
Return ONLY valid JSON — no explanation, no markdown, just raw JSON.

Schema:
{
  "name": "user's name if mentioned, else null",
  "skillLevel": "beginner | intermediate | advanced | null",
  "preferredLanguages": ["list of programming languages or tech they use"],
  "currentProjects": ["projects they mentioned building"],
  "goals": ["what they want to achieve"],
  "topicsDiscussed": ["key topics covered so far"],
  "behaviorNotes": "short note on how they communicate or what they prefer"
}

Rules:
- Merge with existing data — do not erase fields that were previously set
- Keep lists short (max 5 items each)
- If nothing new to extract, return the existing data unchanged
- Never include anything about Zox, only about the user`;

/* ---- State ---- */
const state = {
  groqKey:     localStorage.getItem('zox_groq_key') || '',
  userMemory:  JSON.parse(localStorage.getItem('zox_user_memory') || '{}'),
  sessions:    JSON.parse(localStorage.getItem('zox_sessions') || '[]'),
  currentSessionId: null,
  messages: [], // [{role, content}]
  isStreaming: false,
  exchangeCount: 0, // track exchanges for memory update trigger
};

/* ---- DOM Refs ---- */
const $ = (id) => document.getElementById(id);
const els = {
  sidebar:           $('sidebar'),
  sidebarToggle:     $('sidebar-toggle'),
  newChatBtn:        $('new-chat-btn'),
  chatHistory:       $('chat-history'),
  groqKeyInput:      $('groq-key-input'),
  saveSettingsBtn:   $('save-settings-btn'),
  welcomeScreen:     $('welcome-screen'),
  messagesContainer: $('messages-container'),
  chatInput:         $('chat-input'),
  sendBtn:           $('send-btn'),
  charCount:         $('char-count'),
  modelBadge:        $('model-badge'),
  slashOverlay:      $('slash-overlay'),
};

/* ---- Init ---- */
function init() {
  // Load saved Groq key
  if (state.groqKey) {
    els.groqKeyInput.value = state.groqKey;
    els.groqKeyInput.classList.add('success');
  }

  // Show existing memory in sidebar if any
  updateMemoryIndicator();

  // Render history
  renderHistory();

  // Event Listeners
  els.sidebarToggle.addEventListener('click', toggleSidebar);
  els.newChatBtn.addEventListener('click', newChat);
  els.saveSettingsBtn.addEventListener('click', saveGroqKey);
  els.groqKeyInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveGroqKey(); });
  els.chatInput.addEventListener('input', onInputChange);
  els.chatInput.addEventListener('keydown', onInputKeydown);
  els.sendBtn.addEventListener('click', handleSend);

  // Starter cards
  document.querySelectorAll('.starter-card').forEach((card) => {
    card.addEventListener('click', () => {
      const prompt = card.dataset.prompt;
      if (prompt) {
        els.chatInput.value = prompt;
        onInputChange();
        handleSend();
      }
    });
  });

  // Auto-resize textarea
  els.chatInput.style.height = 'auto';
}

/* ---- Groq Key ---- */
function saveGroqKey() {
  const key = els.groqKeyInput.value.trim();
  if (!key || !key.startsWith('gsk_')) {
    els.groqKeyInput.classList.add('error');
    setTimeout(() => els.groqKeyInput.classList.remove('error'), 600);
    showToast('Invalid key. Must start with gsk_', true);
    return;
  }
  state.groqKey = key;
  localStorage.setItem('zox_groq_key', key);
  els.groqKeyInput.classList.add('success');
  showToast('Key saved. Zox is armed.');
}

/* ---- Sidebar ---- */
function toggleSidebar() {
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    els.sidebar.classList.toggle('mobile-open');
  } else {
    els.sidebar.classList.toggle('collapsed');
  }
}

/* ---- Session Management ---- */
function newChat() {
  state.currentSessionId = null;
  state.messages = [];
  els.messagesContainer.innerHTML = '';
  els.messagesContainer.classList.remove('visible');
  els.welcomeScreen.classList.remove('hidden');
  document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
}

function createSession(firstMessage) {
  const id = Date.now().toString();
  const title = firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '...' : '');
  const session = { id, title, createdAt: Date.now() };
  state.sessions.unshift(session);
  if (state.sessions.length > 30) state.sessions.pop();
  localStorage.setItem('zox_sessions', JSON.stringify(state.sessions));
  state.currentSessionId = id;
  renderHistory();
  return id;
}

function renderHistory() {
  const historyContainer = els.chatHistory;
  // Keep the label
  const label = historyContainer.querySelector('.history-label');
  historyContainer.innerHTML = '';
  if (label) historyContainer.appendChild(label);
  else {
    const lbl = document.createElement('div');
    lbl.className = 'history-label';
    lbl.textContent = 'PAST BATTLES';
    historyContainer.appendChild(lbl);
  }

  if (state.sessions.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:0.72rem;color:var(--text-dim);padding:10px 12px;font-style:italic;';
    empty.textContent = 'No battles yet.';
    historyContainer.appendChild(empty);
    return;
  }

  state.sessions.forEach((session) => {
    const item = document.createElement('div');
    item.className = 'history-item' + (session.id === state.currentSessionId ? ' active' : '');
    item.textContent = session.title;
    item.title = session.title;
    item.dataset.id = session.id;
    item.addEventListener('click', () => {
      showToast('Session switching not supported yet. Start a new mission.');
    });
    historyContainer.appendChild(item);
  });
}

/* ---- Input Handling ---- */
function onInputChange() {
  const val = els.chatInput.value;
  els.charCount.textContent = `${val.length} / 4000`;
  els.sendBtn.disabled = !val.trim() || state.isStreaming;

  // Auto-resize
  els.chatInput.style.height = 'auto';
  els.chatInput.style.height = Math.min(els.chatInput.scrollHeight, 180) + 'px';
}

function onInputKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
    e.preventDefault();
    if (!els.sendBtn.disabled) handleSend();
  }
}

/* ---- Send Message ---- */
async function handleSend() {
  const userText = els.chatInput.value.trim();
  if (!userText || state.isStreaming) return;

  // Check Groq key
  if (!state.groqKey) {
    showToast('No API key. Add your Groq key in the sidebar.', true);
    els.groqKeyInput.focus();
    return;
  }

  // First message → create session
  if (!state.currentSessionId) createSession(userText);

  // Clear input
  els.chatInput.value = '';
  onInputChange();

  // Show chat area, hide welcome
  els.welcomeScreen.classList.add('hidden');
  els.messagesContainer.classList.add('visible');

  // Add to state
  state.messages.push({ role: 'user', content: userText });
  appendUserMessage(userText);
  triggerSlash();

  const typingRow = appendTypingIndicator();
  state.isStreaming = true;
  els.sendBtn.disabled = true;

  try {
    const responseText = await callGroq(state.messages);
    state.messages.push({ role: 'assistant', content: responseText });
    typingRow.remove();
    appendZoxMessage(responseText);

    // Trigger memory update every 3 exchanges
    state.exchangeCount++;
    if (state.exchangeCount % 3 === 0) {
      updateMemory(state.messages).catch(() => {}); // silent background update
    }

  } catch (err) {
    typingRow.remove();
    const errMsg = err.message || 'Unknown error';
    appendZoxMessage(`**ERROR:** ${errMsg}\n\nDouble-check your Groq key in the sidebar.`);
    showToast(errMsg, true);
  } finally {
    state.isStreaming = false;
    els.sendBtn.disabled = !els.chatInput.value.trim();
  }
}

/* ---- Groq API Call (main) ---- */
async function callGroq(messages) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const body = {
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: (window._zoxBuildPrompt || buildSystemPrompt)() }, // dynamic — injects memory + config
      ...messages,
    ],
    temperature: 0.85,
    max_tokens: 1024,
    top_p: 0.9,
  };

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.groqKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (networkErr) {
    throw new Error('Network error. Check your internet connection.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `Groq error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq.');
  return text;
}

/* ---- Memory Update (background, silent) ---- */
async function updateMemory(messages) {
  if (!state.groqKey || messages.length < 2) return;

  // Build context: last 6 messages max to keep it cheap
  const recentMessages = messages.slice(-6);
  const existingMemory = JSON.stringify(state.userMemory || {});

  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body = {
    model: 'llama-3.1-8b-instant', // fast + cheap for extraction
    messages: [
      { role: 'system', content: MEMORY_PROMPT },
      {
        role: 'user',
        content: `Existing memory:\n${existingMemory}\n\nNew conversation:\n${recentMessages.map(m => `${m.role === 'user' ? 'USER' : 'ZOX'}: ${m.content}`).join('\n')}\n\nReturn updated JSON only.`
      }
    ],
    temperature: 0.1,
    max_tokens: 512,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.groqKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) return; // silent fail

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content?.trim();
  if (!raw) return;

  // Parse JSON — strip any accidental markdown
  const jsonStr = raw.replace(/^```json\n?|```$/gm, '').trim();
  const updated = JSON.parse(jsonStr);

  // Merge arrays, don't duplicate
  const merge = (oldArr = [], newArr = []) =>
    [...new Set([...oldArr, ...newArr])].slice(-5);

  state.userMemory = {
    name:               updated.name               || state.userMemory.name,
    skillLevel:         updated.skillLevel          || state.userMemory.skillLevel,
    preferredLanguages: merge(state.userMemory.preferredLanguages, updated.preferredLanguages),
    currentProjects:    merge(state.userMemory.currentProjects,    updated.currentProjects),
    goals:              merge(state.userMemory.goals,               updated.goals),
    topicsDiscussed:    merge(state.userMemory.topicsDiscussed,     updated.topicsDiscussed),
    behaviorNotes:      updated.behaviorNotes       || state.userMemory.behaviorNotes,
    lastUpdated:        new Date().toISOString(),
  };

  localStorage.setItem('zox_user_memory', JSON.stringify(state.userMemory));
  updateMemoryIndicator();
}

/* ---- Memory Indicator in sidebar ---- */
function updateMemoryIndicator() {
  const mem = state.userMemory;
  const existing = document.getElementById('memory-indicator');
  if (existing) existing.remove();

  if (!mem || !mem.lastUpdated) return;

  const facts = [
    mem.name         ? `Name: ${mem.name}` : null,
    mem.skillLevel   ? `Level: ${mem.skillLevel}` : null,
    mem.preferredLanguages?.length ? mem.preferredLanguages.join(', ') : null,
    mem.currentProjects?.length    ? `Building: ${mem.currentProjects[0]}` : null,
  ].filter(Boolean);

  const indicator = document.createElement('div');
  indicator.id = 'memory-indicator';
  indicator.style.cssText = `
    padding: 10px 12px;
    border-top: 1px solid var(--border);
    font-size: 0.62rem;
    color: var(--text-muted);
    line-height: 1.6;
  `;
  indicator.innerHTML = `
    <div style="color:var(--green-neon);letter-spacing:0.15em;text-transform:uppercase;font-size:0.58rem;margin-bottom:4px;">⚡ ZOX KNOWS YOU</div>
    ${facts.map(f => `<div style="color:var(--text-dim)">${f}</div>`).join('')}
    <div style="margin-top:6px;">
      <button onclick="clearMemory()" style="background:none;border:1px solid var(--border);border-radius:4px;color:var(--text-dim);font-size:0.6rem;padding:2px 8px;cursor:pointer;font-family:var(--font-main)">Clear Memory</button>
    </div>
  `;

  // Insert before sidebar footer
  const footer = document.querySelector('.sidebar-footer');
  footer.parentNode.insertBefore(indicator, footer);
}

function clearMemory() {
  state.userMemory = {};
  state.exchangeCount = 0;
  localStorage.removeItem('zox_user_memory');
  const ind = document.getElementById('memory-indicator');
  if (ind) ind.remove();
  showToast('Memory wiped. Starting fresh.');
}
window.clearMemory = clearMemory;

/* ---- Render Messages ---- */
function appendUserMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row user-row';
  row.innerHTML = `
    <div class="msg-avatar">
      <div class="user-avatar-icon">U</div>
    </div>
    <div class="msg-content">
      <div class="msg-label">You</div>
      <div class="msg-bubble">${escapeHtml(text)}</div>
      <div class="msg-actions">
        <button class="msg-action-btn" onclick="copyToClipboard(this, ${JSON.stringify(text)})">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>
    </div>
  `;
  els.messagesContainer.appendChild(row);
  scrollToBottom();
}

function appendZoxMessage(markdown) {
  const row = document.createElement('div');
  row.className = 'message-row zox-row';
  const htmlContent = renderMarkdown(markdown);
  row.innerHTML = `
    <div class="msg-avatar zox-avatar">
      <img src="zox_avatar.png" alt="Zox" />
    </div>
    <div class="msg-content">
      <div class="msg-label">ZOX</div>
      <div class="msg-bubble">${htmlContent}</div>
      <div class="msg-actions">
        <button class="msg-action-btn" onclick="copyToClipboard(this, ${JSON.stringify(markdown)})">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>
    </div>
  `;
  els.messagesContainer.appendChild(row);

  // Add copy buttons to code blocks
  row.querySelectorAll('pre code').forEach((block) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';
    block.parentNode.replaceWith(wrapper);
    wrapper.appendChild(block.parentNode || block);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.textContent = 'copy';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(block.textContent).then(() => {
        copyBtn.textContent = 'copied!';
        setTimeout(() => { copyBtn.textContent = 'copy'; }, 1500);
      });
    });
    wrapper.appendChild(copyBtn);
  });

  scrollToBottom();
}

function appendTypingIndicator() {
  const row = document.createElement('div');
  row.className = 'message-row zox-row';
  row.innerHTML = `
    <div class="msg-avatar zox-avatar">
      <img src="zox_avatar.png" alt="Zox" />
    </div>
    <div class="msg-content">
      <div class="msg-label">ZOX</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>
  `;
  els.messagesContainer.appendChild(row);
  scrollToBottom();
  return row;
}

/* ---- Markdown Renderer ---- */
function renderMarkdown(text) {
  let html = escapeHtml(text);

  // Code blocks (must come before inline code)
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr>');

  // Unordered list
  html = html.replace(/(?:^- .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Ordered list
  html = html.replace(/(?:^\d+\. .+\n?)+/gm, (match) => {
    const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  // Single newlines
  html = html.replace(/([^>])\n([^<])/g, '$1<br/>$2');

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-3]>)/g, '$1');
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>|<ol>|<pre>|<blockquote>|<hr>)/g, '$1');
  html = html.replace(/(<\/ul>|<\/ol>|<\/pre>|<\/blockquote>)<\/p>/g, '$1');

  return html;
}

/* ---- Utilities ---- */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function scrollToBottom() {
  els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
}

function copyToClipboard(btn, text) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.innerHTML;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  }).catch(() => showToast('Copy failed.', true));
}
window.copyToClipboard = copyToClipboard;

function showToast(message, isError = false) {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'toast' + (isError ? ' error' : '');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ---- Slash Animation ---- */
function triggerSlash() {
  els.slashOverlay.classList.remove('hidden');
  setTimeout(() => els.slashOverlay.classList.add('hidden'), 400);
}

/* ---- Background Canvas Particles ---- */
function initCanvas() {
  const canvas = $('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  });

  // Floating particles
  const PARTICLE_COUNT = 60;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    r: Math.random() * 1.5 + 0.3,
    a: Math.random(),
  }));

  // Sparse grid lines
  function drawGrid() {
    ctx.strokeStyle = '#0a1a1200';
    ctx.lineWidth = 0.5;
    const spacing = 80;

    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = '#39ff8c';
    for (let x = 0; x < W; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawGrid();

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(57, 255, 140, ${p.a * 0.35})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const alpha = (1 - dist / 100) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(57, 255, 140, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }
  draw();
}

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', () => {
  init();
  initCanvas();
  initFineTune();
});

/* ============================
   FINE-TUNE MODAL
   ============================ */

const TONE_DESCS = [
  '',
  'Savage Zoro. Rude, blunt, zero patience. Maximum roast.',
  'Default Zox. Rude but not evil. Blunt mentor.',
  'Balanced. Firm but fair. Less sarcasm.',
  'Calm mentor. Direct and helpful. Minimal roast.',
  'Professional mode. Respectful, structured, expert.',
];

const SPECIALTY_PROMPTS = {
  all:      '',
  coding:   'Focus heavily on coding, programming, software engineering. Prioritize technical depth.',
  learning: 'Focus on learning paths, study strategies, and mastering concepts fast.',
  content:  'Focus on content creation, writing, YouTube, social media, and building an audience.',
  business: 'Focus on business, startups, productivity, and entrepreneurship.',
  research: 'Focus on research, analysis, finding information, and academic topics.',
};

// Load saved fine-tune config
const DEFAULT_CONFIG = { tone: 2, specialty: 'all', roast: true, tools: true, short: false, custom: '' };

function loadConfig() {
  try {
    return JSON.parse(localStorage.getItem('zox_config') || 'null') || { ...DEFAULT_CONFIG };
  } catch { return { ...DEFAULT_CONFIG }; }
}

state.config = loadConfig();

function initFineTune() {
  const modal    = document.getElementById('finetune-modal');
  const openBtn  = document.getElementById('finetune-btn');
  const closeBtn = document.getElementById('modal-close');
  const saveBtn  = document.getElementById('modal-save');
  const resetBtn = document.getElementById('modal-reset');
  const toneSlider = document.getElementById('tune-tone');
  const toneDesc   = document.getElementById('tone-desc');
  const roastChk   = document.getElementById('tune-roast');
  const toolsChk   = document.getElementById('tune-tools');
  const shortChk   = document.getElementById('tune-short');
  const customTxt  = document.getElementById('tune-custom');
  const modeGrid   = document.getElementById('mode-grid');

  // Populate from saved config
  function loadToUI(cfg) {
    toneSlider.value  = cfg.tone;
    toneDesc.textContent = TONE_DESCS[cfg.tone];
    roastChk.checked  = cfg.roast;
    toolsChk.checked  = cfg.tools;
    shortChk.checked  = cfg.short;
    customTxt.value   = cfg.custom || '';
    modeGrid.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === cfg.specialty);
    });
  }
  loadToUI(state.config);

  // Tone slider live update
  toneSlider.addEventListener('input', () => {
    toneDesc.textContent = TONE_DESCS[+toneSlider.value];
  });

  // Mode buttons
  modeGrid.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modeGrid.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Open / Close
  openBtn.addEventListener('click', () => {
    loadToUI(state.config);
    modal.classList.remove('hidden');
  });
  closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

  // Save
  saveBtn.addEventListener('click', () => {
    const activeMode = modeGrid.querySelector('.mode-btn.active')?.dataset.mode || 'all';
    state.config = {
      tone:      +toneSlider.value,
      specialty: activeMode,
      roast:     roastChk.checked,
      tools:     toolsChk.checked,
      short:     shortChk.checked,
      custom:    customTxt.value.trim(),
    };
    localStorage.setItem('zox_config', JSON.stringify(state.config));
    modal.classList.add('hidden');
    showToast('Zox reforged. Changes active now.');
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    state.config = { ...DEFAULT_CONFIG };
    localStorage.removeItem('zox_config');
    loadToUI(state.config);
    showToast('Reset to default Zox.');
  });
}

/* Inject config into system prompt */
const _buildBase = buildSystemPrompt;
// Override buildSystemPrompt to also inject fine-tune config
const buildSystemPromptWithConfig = function() {
  let base = _buildBase();
  const cfg = state.config || DEFAULT_CONFIG;

  const additions = [];

  // Tone
  if (cfg.tone === 1) additions.push('TONE: Maximum savage mode. Be extremely blunt, sarcastic, zero patience.');
  else if (cfg.tone === 3) additions.push('TONE: More balanced today. Less sarcasm, still direct.');
  else if (cfg.tone === 4) additions.push('TONE: Calm mentor mode. Be helpful and firm, minimal roasting.');
  else if (cfg.tone === 5) additions.push('TONE: Professional mode. Be respectful, structured, and expert.');

  // Specialty
  if (cfg.specialty && cfg.specialty !== 'all' && SPECIALTY_PROMPTS[cfg.specialty]) {
    additions.push(SPECIALTY_PROMPTS[cfg.specialty]);
  }

  // Toggles
  if (!cfg.roast) additions.push('Do NOT roast or call out laziness. Stay helpful without judgment.');
  if (!cfg.tools) additions.push('Do NOT suggest external AI tools or redirect to other services.');
  if (cfg.short)  additions.push('Keep ALL responses very short. Maximum 5 sentences. No long explanations.');

  // Custom rules
  if (cfg.custom) additions.push(`USER RULES (follow strictly):\n${cfg.custom}`);

  if (additions.length === 0) return base;
  return base + '\n\n### ACTIVE CONFIGURATION\n' + additions.join('\n');
};

// Replace the function reference used by callGroq
window._zoxBuildPrompt = buildSystemPromptWithConfig;
