/**
 * PeerLearn — Dummy Chat Module
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for the existing chat section in public/index.html.
 *
 * HOW TO WIRE TO THE REAL BACKEND LATER:
 *   Every function that currently uses dummy data is marked with:
 *     // TODO(backend): <what to swap in>
 *   Replace those sections with your existing `apiCall()` calls.
 *   The real API endpoints are already built in api/chat.js:
 *     GET  /api/chat/conversations
 *     POST /api/chat/conversations  { type: 'dm', user_id }
 *     GET  /api/chat/messages?conversation_id=<id>
 *     POST /api/chat/messages       { conversation_id, content }
 *     PUT  /api/chat/messages?conversation_id=<id>   (mark read)
 *   Supabase Realtime subscription lives in setupGlobalChatListener() — also
 *   already written in index.html; just call it after auth.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────

const DUMMY_USERS = [
  { id: 'u1', full_name: 'Priya Sharma',   username: 'priya_s',    avatar_skin: '🦊' },
  { id: 'u2', full_name: 'Arjun Mehta',    username: 'arjun_m',    avatar_skin: '🐺' },
  { id: 'u3', full_name: 'Sneha Nair',     username: 'sneha_n',    avatar_skin: '🦉' },
  { id: 'u4', full_name: 'Rahul Verma',    username: 'rahul_v',    avatar_skin: '🐯' },
  { id: 'u5', full_name: 'Ananya Iyer',    username: 'ananya_i',   avatar_skin: '🦋' },
];

const DUMMY_CONVERSATIONS = [
  {
    id: 'conv1',
    is_group: false,
    display_name: 'Priya Sharma',
    display_avatar: '🦊',
    target_user_id: 'u1',
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    last_message: { content: 'Hey! Are you free for the study session?', created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
  },
  {
    id: 'conv2',
    is_group: false,
    display_name: 'Arjun Mehta',
    display_avatar: '🐺',
    target_user_id: 'u2',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    last_message: { content: 'Shared the notes for DSA chapter 6 📝', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  },
  {
    id: 'conv3',
    is_group: true,
    name: 'DBMS Study Group',
    display_name: 'DBMS Study Group',
    display_avatar: '📚',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    last_message: { content: 'Quiz at 7 PM today — don\'t miss it!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  },
  {
    id: 'conv4',
    is_group: false,
    display_name: 'Sneha Nair',
    display_avatar: '🦉',
    target_user_id: 'u3',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    last_message: { content: 'Can you review my ML assignment?', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  },
];

// Messages keyed by conversation id
const DUMMY_MESSAGES = {
  conv1: [
    { id: 'm1', sender_id: 'u1', content: 'Hey! Are you free this evening for the DSA session?', created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
    { id: 'm2', sender_id: 'ME',  content: 'Yeah, 7 PM works! Should I bring the practice problems from Chapter 5?', created_at: new Date(Date.now() - 1000 * 60 * 13).toISOString() },
    { id: 'm3', sender_id: 'u1', content: 'Perfect! Also can you look at my BFS implementation? I think the visited set is off 🤔', created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
    { id: 'm4', sender_id: 'ME',  content: 'Sure, paste it when you\'re ready', created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
    { id: 'm5', sender_id: 'u1', content: 'Hey! Are you free for the study session?', created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString() },
  ],
  conv2: [
    { id: 'm6', sender_id: 'ME',  content: 'Arjun, did you get the assignment extension?', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { id: 'm7', sender_id: 'u2', content: 'Yes! Prof gave 2 more days. Also shared the notes for DSA chapter 6 📝', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  ],
  conv3: [
    { id: 'm8', sender_id: 'u3', content: 'Everyone please revise ER diagrams before the session!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'm9', sender_id: 'u2', content: 'Also normalisation up to 3NF — that\'s always on the exam', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString() },
    { id: 'm10', sender_id: 'ME', content: 'Got it, see you all there', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2.2).toISOString() },
    { id: 'm11', sender_id: 'u4', content: 'Quiz at 7 PM today — don\'t miss it!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  ],
  conv4: [
    { id: 'm12', sender_id: 'u3', content: 'Hi! Can you review my ML assignment? Specifically the gradient descent part', created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
    { id: 'm13', sender_id: 'ME', content: 'Sure, send it over!', created_at: new Date(Date.now() - 1000 * 60 * 60 * 4.8).toISOString() },
  ],
};

// ─── STATE ────────────────────────────────────────────────────────────────────

let activeConversationId = null;   // currently open conversation
let dummyConversations    = JSON.parse(JSON.stringify(DUMMY_CONVERSATIONS));
let dummyMessages         = JSON.parse(JSON.stringify(DUMMY_MESSAGES));
let dummyConnections      = [...DUMMY_USERS];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Returns a shallow clone of the dummy current user.
 * When wiring to real auth: replace with the real `currentUser` object from
 * index.html (already set via loadInitialData → apiCall('/api/auth/me')).
 *
 * TODO(backend): Remove this entirely — real index.html already has `currentUser`.
 */
function getMe() {
  // Dummy stand-in; in the real app `currentUser` is a global in index.html
  if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
  return { id: 'ME', full_name: 'You', avatar_skin: '🎓' };
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtPreviewTime(iso) {
  const d   = new Date(iso);
  const now = new Date();
  const diffH = (now - d) / 3600000;
  if (diffH < 24) return fmtTime(iso);
  if (diffH < 168) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── CONVERSATION LIST ────────────────────────────────────────────────────────

/**
 * Renders the sidebar conversation list.
 *
 * TODO(backend): Replace the `convs` assignment with:
 *   const { conversations } = await apiCall('/api/chat/conversations');
 *   const convs = conversations;
 */
async function loadConversations() {
  const list = document.getElementById('chat-list');
  if (!list) return;

  // ── DUMMY DATA ──────────────────────────────────────────────────────────────
  const convs = dummyConversations;
  // ── END DUMMY ───────────────────────────────────────────────────────────────

  if (!convs.length) {
    list.innerHTML = `
      <div style="padding:28px 16px;text-align:center">
        <div style="font-size:28px;margin-bottom:8px">💬</div>
        <div style="font-size:12px;color:var(--text3);line-height:1.6">
          No conversations yet.<br>Search a peer above to start chatting!
        </div>
      </div>`;
    return;
  }

  list.innerHTML = convs.map(conv => {
    const last    = conv.last_message;
    const isActive = activeConversationId === conv.id;
    const preview = last?.content || 'No messages yet';
    const time    = last?.created_at ? fmtPreviewTime(last.created_at) : '';

    return `
      <div class="chat-item ${isActive ? 'active' : ''}" onclick="openConversation('${conv.id}','${conv.display_name}','${conv.display_avatar}')">
        <div class="chat-ava" style="background:var(--bg3);font-size:18px;flex-shrink:0">${conv.display_avatar}</div>
        <div style="flex:1;min-width:0">
          <div class="chat-name">${conv.display_name}</div>
          <div class="chat-preview">${preview}</div>
        </div>
        <div class="chat-time">${time}</div>
      </div>`;
  }).join('');
}

// ─── SEARCH ───────────────────────────────────────────────────────────────────

/**
 * Filters the user's connections as they type in the search box.
 *
 * TODO(backend): Replace the connection list fetch with:
 *   const { users } = await apiCall('/api/follows?type=following');
 *   const filtered  = users.filter(...);
 */
async function handleChatSearch(query) {
  const resultsDiv = document.getElementById('chat-search-results');
  if (!resultsDiv) return;

  if (!query.trim()) {
    resultsDiv.classList.add('hidden');
    return;
  }

  // ── DUMMY DATA ──────────────────────────────────────────────────────────────
  const connections = dummyConnections;
  // ── END DUMMY ───────────────────────────────────────────────────────────────

  const q        = query.toLowerCase();
  const filtered = connections.filter(u =>
    u.full_name.toLowerCase().includes(q) ||
    (u.username || '').toLowerCase().includes(q)
  );

  if (!filtered.length) {
    resultsDiv.innerHTML = `
      <div style="padding:12px;font-size:12px;color:var(--text3);text-align:center">
        No peers found matching "<strong>${query}</strong>"
      </div>`;
    resultsDiv.classList.remove('hidden');
    return;
  }

  resultsDiv.innerHTML = filtered.map(u => `
    <div class="search-result-item"
         style="display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer;transition:background .15s"
         onmouseenter="this.style.background='var(--bg3)'"
         onmouseleave="this.style.background=''"
         onclick="startChatWith('${u.id}','${u.full_name}','${u.avatar_skin || u.full_name[0]}')">
      <div class="chat-ava" style="width:34px;height:34px;font-size:16px;background:var(--bg3);flex-shrink:0">${u.avatar_skin || u.full_name[0]}</div>
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">${u.full_name}</div>
        <div style="font-size:11px;color:var(--text3)">@${u.username || u.full_name.replace(' ', '_').toLowerCase()}</div>
      </div>
      <div style="margin-left:auto;font-size:11px;color:var(--accent);font-weight:700">Chat →</div>
    </div>`).join('');
  resultsDiv.classList.remove('hidden');
}

// Close search results when clicking outside
document.addEventListener('click', e => {
  if (!e.target.closest('.chat-search')) {
    const r = document.getElementById('chat-search-results');
    if (r) r.classList.add('hidden');
  }
});

// ─── START / OPEN CONVERSATION ───────────────────────────────────────────────

/**
 * Creates (or finds) a DM with the given userId then opens it.
 *
 * TODO(backend): Replace the block below the comment with:
 *   const { conversation_id } = await apiCall('/api/chat/conversations', 'POST',
 *                                             { type: 'dm', user_id: userId });
 *   await openConversation(conversation_id, name, skin);
 *   await loadConversations();
 */
async function startChatWith(userId, name, skin) {
  const searchInput   = document.querySelector('.chat-search input');
  const searchResults = document.getElementById('chat-search-results');
  if (searchInput)   searchInput.value = '';
  if (searchResults) searchResults.classList.add('hidden');

  // ── DUMMY DATA ──────────────────────────────────────────────────────────────
  let existing = dummyConversations.find(c => c.target_user_id === userId && !c.is_group);
  if (!existing) {
    const newId = 'conv_' + Date.now();
    existing = {
      id: newId,
      is_group: false,
      display_name: name,
      display_avatar: skin,
      target_user_id: userId,
      created_at: new Date().toISOString(),
      last_message: null,
    };
    dummyConversations.unshift(existing);
    dummyMessages[newId] = [];
  }
  // ── END DUMMY ───────────────────────────────────────────────────────────────

  await openConversation(existing.id, name, skin);
  await loadConversations();
}

/**
 * Opens a conversation: sets the header, loads messages.
 *
 * TODO(backend): Replace the messages fetch with:
 *   const { messages } = await apiCall(`/api/chat/messages?conversation_id=${id}`);
 *   renderMessages(messages, getMe().id);
 *   // Also fire mark-as-read:
 *   await apiCall(`/api/chat/messages?conversation_id=${id}`, 'PUT');
 */
async function openConversation(id, name, skin) {
  activeConversationId = id;

  // Update sidebar active state
  document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
  const activeItem = document.querySelector(`.chat-item[onclick*="${id}"]`);
  if (activeItem) activeItem.classList.add('active');

  // Update header
  const headerAva    = document.getElementById('ch-ava');
  const headerName   = document.getElementById('ch-name');
  const headerStatus = document.getElementById('ch-status');
  if (headerAva)    { headerAva.textContent = skin; headerAva.style.fontSize = '20px'; }
  if (headerName)   headerName.textContent  = name;
  if (headerStatus) { headerStatus.textContent = 'Active now'; headerStatus.style.color = 'var(--green)'; }

  const msgsContainer = document.getElementById('chat-messages');
  if (!msgsContainer) return;

  // Loading state
  msgsContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;padding:10px;animation:shimmer 1.2s ease-in-out infinite">
      ${['60%','40%','75%','50%','65%'].map((w, i) => `
        <div style="max-width:${w};align-self:${i % 2 === 0 ? 'flex-end' : 'flex-start'}">
          <div style="height:36px;background:var(--bg3);border-radius:12px;opacity:0.5"></div>
        </div>`).join('')}
    </div>`;

  // Tiny artificial delay for realistic feel (remove when using real API)
  await new Promise(r => setTimeout(r, 250));

  // ── DUMMY DATA ──────────────────────────────────────────────────────────────
  const messages = dummyMessages[id] || [];
  // ── END DUMMY ───────────────────────────────────────────────────────────────

  renderMessages(messages, getMe().id);
}

// ─── RENDER HELPERS ──────────────────────────────────────────────────────────

/**
 * Renders a full message list into #chat-messages.
 * Works with both dummy messages (sender_id === 'ME') and real API messages
 * (sender.id matches currentUser.id).
 */
function renderMessages(messages, myId) {
  const msgsContainer = document.getElementById('chat-messages');
  if (!msgsContainer) return;

  if (!messages.length) {
    msgsContainer.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;padding:40px">
        <div style="font-size:40px">✉️</div>
        <div style="font-size:13px;color:var(--text3);text-align:center;line-height:1.6">
          No messages yet.<br>Say hello and break the ice! 👋
        </div>
      </div>`;
    return;
  }

  // Group consecutive messages by same sender for a cleaner look
  msgsContainer.innerHTML = messages.map((m, idx) => {
    const senderId  = m.sender?.id || m.sender_id;
    const isMine    = senderId === myId || senderId === 'ME';
    const type      = isMine ? 'mine' : 'theirs';
    const prevMsg   = messages[idx - 1];
    const prevSender = prevMsg ? (prevMsg.sender?.id || prevMsg.sender_id) : null;
    const isNewGroup = prevSender !== senderId;

    return `
      <div class="msg ${type}" ${isNewGroup ? 'style="margin-top:6px"' : ''}>
        <div class="msg-bubble">${escapeHtml(m.content)}</div>
        <div class="msg-time">${fmtTime(m.created_at)}</div>
      </div>`;
  }).join('');

  msgsContainer.scrollTop = msgsContainer.scrollHeight;
}

/**
 * Appends a single new message to the chat window (used for optimistic UI
 * and real-time incoming messages).
 *
 * Compatible with both:
 *   appendMessage({ content, created_at, sender_id: 'ME' }, 'mine')
 *   appendMessage(realtimePayload, 'theirs')             // real Supabase payload
 */
function appendMessage(m, type) {
  const msgsContainer = document.getElementById('chat-messages');
  if (!msgsContainer) return;

  // Clear empty state
  if (msgsContainer.querySelector('[style*="Say hello"]') ||
      msgsContainer.querySelector('[style*="No messages"]')) {
    msgsContainer.innerHTML = '';
  }

  msgsContainer.insertAdjacentHTML('beforeend', `
    <div class="msg ${type}">
      <div class="msg-bubble">${escapeHtml(m.content)}</div>
      <div class="msg-time">${fmtTime(m.created_at || new Date().toISOString())}</div>
    </div>`);

  msgsContainer.scrollTop = msgsContainer.scrollHeight;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────

/**
 * Reads the input, optimistically appends to the UI, then persists.
 *
 * TODO(backend): Replace the dummy block with:
 *   const { message } = await apiCall('/api/chat/messages', 'POST', {
 *     conversation_id: activeConversationId,
 *     content: txt,
 *   });
 *   appendMessage(message, 'mine');
 *   await loadConversations();
 */
async function sendMsg() {
  const inp = document.getElementById('chat-input');
  const txt = inp.value.trim();
  if (!txt || !activeConversationId) return;

  inp.value = '';

  const newMsg = {
    id:         'local_' + Date.now(),
    sender_id:  'ME',
    content:    txt,
    created_at: new Date().toISOString(),
  };

  // ── DUMMY DATA ──────────────────────────────────────────────────────────────
  // Optimistic append
  appendMessage(newMsg, 'mine');

  // Persist in local dummy store
  if (!dummyMessages[activeConversationId]) {
    dummyMessages[activeConversationId] = [];
  }
  dummyMessages[activeConversationId].push(newMsg);

  // Update sidebar preview
  const conv = dummyConversations.find(c => c.id === activeConversationId);
  if (conv) conv.last_message = { content: txt, created_at: newMsg.created_at };
  await loadConversations();

  // Simulate a reply after a short delay (remove when real backend is wired)
  _maybeSimulateReply(activeConversationId, txt);
  // ── END DUMMY ───────────────────────────────────────────────────────────────
}

// ─── SIMULATED REPLIES (dummy only — delete when backend is live) ─────────────

const DUMMY_REPLIES = [
  'That\'s a great point! 💡',
  'Thanks for the note! I\'ll check it out',
  'Can you share the resource link?',
  'Sure, let\'s sync up before class 🕐',
  'Got it 👍',
  'Makes sense. I was confused about that too',
  'I\'ll ask the prof in today\'s session',
  'Awesome, see you then! 🙌',
];

function _maybeSimulateReply(convId, _sentText) {
  // Only reply sometimes, and only in non-group DMs
  const conv = dummyConversations.find(c => c.id === convId);
  if (!conv || conv.is_group) return;
  if (Math.random() < 0.4) return; // 60% chance of reply

  const delay = 1200 + Math.random() * 1800; // 1.2–3 s
  setTimeout(() => {
    if (activeConversationId !== convId) return;
    const replyContent = DUMMY_REPLIES[Math.floor(Math.random() * DUMMY_REPLIES.length)];
    const reply = {
      id:         'reply_' + Date.now(),
      sender_id:  conv.target_user_id,
      content:    replyContent,
      created_at: new Date().toISOString(),
    };
    dummyMessages[convId].push(reply);
    if (activeConversationId === convId) appendMessage(reply, 'theirs');
    conv.last_message = { content: replyContent, created_at: reply.created_at };
    loadConversations();
  }, delay);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

/**
 * Called once after auth to set up the chat sidebar.
 *
 * TODO(backend): This is already called via loadInitialData() in index.html.
 * Once you remove this file and integrate the real API calls, no extra wiring
 * is needed — loadConversations() is already invoked there.
 */
(async function initDummyChat() {
  await loadConversations();
})();
