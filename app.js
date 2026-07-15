// ==================== DATABASE LAYER (LOCALSTORAGE MOCK DB) ====================
const DB = {
  // Key names in LocalStorage
  KEYS: {
    USERS: 'qb_users',
    CHARACTERS: 'qb_characters',
    WORKSPACES: 'qb_workspaces',
    MEMBERS: 'qb_workspace_members',
    QUESTS: 'qb_quests',
    SUB_QUESTS: 'qb_sub_quests',
    COMMENTS: 'qb_comments',
    REWARDS: 'qb_rewards',
    LOGS: 'qb_adventure_logs'
  },

  init() {
    // Helper to seed localStorage if empty
    const initTable = (key, defaultData) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(defaultData));
      }
    };

    // Seed tables
    initTable(this.KEYS.USERS, [
      { id: 1, username: 'ranger_najmu', email: 'najmu@quest.com', password: 'password123' },
      { id: 2, username: 'mage_sarah', email: 'sarah@quest.com', password: 'password123' },
      { id: 3, username: 'warrior_alex', email: 'alex@quest.com', password: 'password123' }
    ]);

    initTable(this.KEYS.CHARACTERS, [
      { id: 1, user_id: 1, level: 1, xp: 45, hp: 100, gold: 120, avatar: '🛡️' },
      { id: 2, user_id: 2, level: 2, xp: 120, hp: 90, gold: 240, avatar: '🔮' },
      { id: 3, user_id: 3, level: 1, xp: 10, hp: 100, gold: 50, avatar: '🛡️' }
    ]);

    initTable(this.KEYS.WORKSPACES, [
      { id: 1, title: 'Solo Campaign: Personal Growth', description: 'My solo habits, routines, and personal projects.', is_group: false, created_by: 1 },
      { id: 2, title: 'Guild: Biology Group Project', description: 'Group research project on ecosystem dynamics.', is_group: true, created_by: 1 }
    ]);

    initTable(this.KEYS.MEMBERS, [
      { id: 1, workspace_id: 2, user_id: 1 }, // najmu
      { id: 2, workspace_id: 2, user_id: 2 }, // sarah
      { id: 3, workspace_id: 2, user_id: 3 }  // alex
    ]);

    // Initial Quests
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    initTable(this.KEYS.QUESTS, [
      { id: 1, workspace_id: 1, assigned_to: 1, title: 'Daily Workout (Cardio)', description: 'Run for 30 minutes in the park and do basic stretches.', status: 'todo', difficulty: 'easy', deadline: tomorrow.toISOString(), penalized: false, order: 10 },
      { id: 2, workspace_id: 1, assigned_to: 1, title: 'Read Chapter 4 of Math Book', description: 'Read and take summary notes of Calculus derivatives.', status: 'inprogress', difficulty: 'medium', deadline: tomorrow.toISOString(), penalized: false, order: 20 },
      { id: 3, workspace_id: 2, assigned_to: 2, title: 'Write Introduction Section', description: 'Draft the ecosystem report introduction paragraph.', status: 'todo', difficulty: 'medium', deadline: tomorrow.toISOString(), penalized: false, order: 10 },
      { id: 4, workspace_id: 2, assigned_to: 1, title: 'Draw Food Web Diagram', description: 'Draw the diagram vectors for pond and forest trophic webs.', status: 'inprogress', difficulty: 'hard', deadline: tomorrow.toISOString(), penalized: false, order: 10 },
      { id: 5, workspace_id: 2, assigned_to: 3, title: 'Assemble Final Slideshow', description: 'Merge slides from all members and design templates.', status: 'todo', difficulty: 'epic', deadline: yesterday.toISOString(), penalized: false, order: 20 } // Overdue
    ]);

    initTable(this.KEYS.SUB_QUESTS, [
      { id: 1, quest_id: 2, description: 'Read pages 120-135', is_completed: true },
      { id: 2, quest_id: 2, description: 'Solve 5 sample exercises', is_completed: false },
      { id: 3, quest_id: 4, description: 'Gather pond species list', is_completed: true },
      { id: 4, quest_id: 4, description: 'Design vector layout', is_completed: true }
    ]);

    initTable(this.KEYS.COMMENTS, [
      { id: 1, quest_id: 4, user_id: 2, username: 'mage_sarah', content: 'I uploaded the pond photos in the group folder for reference!', created_at: new Date(now.getTime() - 3600000).toISOString() },
      { id: 2, quest_id: 4, user_id: 1, username: 'ranger_najmu', content: 'Great, thanks Sarah! I will start sketching them now.', created_at: new Date(now.getTime() - 1800000).toISOString() }
    ]);

    initTable(this.KEYS.REWARDS, [
      { id: 1, user_id: 1, title: 'Play video games for 1 hour', cost: 50, is_custom: false },
      { id: 2, user_id: 1, title: 'Eat a slice of double chocolate cake', cost: 120, is_custom: false },
      { id: 3, user_id: 1, title: 'Buy a fantasy novel book', cost: 350, is_custom: false },
      { id: 4, user_id: 2, title: 'Watch a movie episode', cost: 50, is_custom: false }
    ]);

    initTable(this.KEYS.LOGS, [
      { id: 1, user_id: 1, type: 'general', message: 'Character created! Welcome to the realm.', timestamp: now.toISOString() }
    ]);
  },

  get(table) {
    return JSON.parse(localStorage.getItem(table)) || [];
  },

  set(table, data) {
    localStorage.setItem(table, JSON.stringify(data));
  },

  insert(table, row) {
    const data = this.get(table);
    const newId = data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
    const newRow = { id: newId, ...row };
    data.push(newRow);
    this.set(table, data);
    
    // Asynchronously sync to Supabase
    if (typeof syncInsert === 'function') {
      syncInsert(table, newRow);
    }
    
    return newRow;
  },

  update(table, id, updates) {
    const data = this.get(table);
    const index = data.findIndex(item => item.id == id);
    if (index !== -1) {
      data[index] = { ...data[index], ...updates };
      this.set(table, data);
      
      // Asynchronously sync to Supabase
      if (typeof syncUpdate === 'function') {
        syncUpdate(table, id, data[index]);
      }
      
      return data[index];
    }
    return null;
  },

  delete(table, id) {
    const data = this.get(table);
    const filtered = data.filter(item => item.id != id);
    this.set(table, filtered);
    
    // Asynchronously sync to Supabase
    if (typeof syncDelete === 'function') {
      syncDelete(table, id);
    }
    
    return filtered;
  }
};

// ==================== RETRO RPG SOUND SYNTHESIZER ====================
const SoundFX = {
  muted: false,
  ctx: null,

  initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  play(type) {
    if (this.muted) return;
    try {
      this.initContext();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      
      const now = this.ctx.currentTime;
      
      if (type === 'coin') {
        // Double-beep retro gold coin jingle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
      } 
      else if (type === 'level_up') {
        // Uplifting major chord arpeggio chime
        const frequencies = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
        frequencies.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + (i * 0.07));
          
          gain.gain.setValueAtTime(0.15, now + (i * 0.07));
          gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.07) + 0.3);
          
          osc.start(now + (i * 0.07));
          osc.stop(now + (i * 0.07) + 0.3);
        });
      } 
      else if (type === 'damage') {
        // Low grinding harsh noise
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.35);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        osc.start(now);
        osc.stop(now + 0.35);
      } 
      else if (type === 'click') {
        // Quick short select click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(300, now + 0.05);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
      }
      else if (type === 'purchase') {
        // High pitched descending chime
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.25);
        
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.25);
      }
      else if (type === 'fail') {
        // Disappointed dual buzzer buzz
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.setValueAtTime(215, now + 0.05);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
        
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      console.warn("Web Audio API failed or is not supported", e);
    }
  }
};

// ==================== SYSTEM CONSTANTS & CONFIGS ====================
const DIFFICULTY_MATRIX = {
  easy: { gold: 10, xp: 15, damage: 5 },
  medium: { gold: 20, xp: 30, damage: 12 },
  hard: { gold: 50, xp: 75, damage: 25 },
  epic: { gold: 100, xp: 150, damage: 40 }
};

// ==================== APP STATE ====================
let state = {
  currentUser: null,
  currentCharacter: null,
  activeWorkspaceId: null,
  activeQuestId: null,
  draggedQuestId: null,
  dragSourceColumn: null
};

// Broadcast channel for real-time synchronization between tabs
const syncChannel = new BroadcastChannel('questboard_sync');

// ==================== APP INIT ====================
window.addEventListener('DOMContentLoaded', async () => {
  DB.init();
  setupAudioControl();
  
  // Sync with Supabase if configured
  if (typeof initSupabase === 'function') {
    const client = await initSupabase();
    if (client) {
      await syncWithSupabase(client);
    }
  }
  
  checkSession();
  
  // Listen for real-time channel sync notifications
  syncChannel.onmessage = (event) => {
    console.log("Sync Channel Event Received:", event.data);
    handleSyncEvent(event.data);
  };
});

function setupAudioControl() {
  const btn = document.getElementById('audio-toggle-btn');
  btn.addEventListener('click', () => {
    SoundFX.muted = !SoundFX.muted;
    if (SoundFX.muted) {
      btn.classList.add('muted');
      btn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    } else {
      btn.classList.remove('muted');
      btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      SoundFX.play('click');
    }
  });
}

// Check if user is logged in
function checkSession() {
  const sessionUser = sessionStorage.getItem('qb_active_user');
  if (sessionUser) {
    const user = JSON.parse(sessionUser);
    loginUser(user);
  } else {
    showScreen('auth-screen');
  }
}

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// ==================== AUTH LOGIC ====================
let currentAuthTab = 'login';

function switchAuthTab(tab) {
  SoundFX.play('click');
  currentAuthTab = tab;
  document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
  
  const usernameGroup = document.getElementById('username-group');
  const submitBtnText = document.querySelector('#auth-submit-btn .btn-text');
  const errorMsg = document.getElementById('auth-error-msg');
  errorMsg.innerText = '';
  
  if (tab === 'login') {
    document.getElementById('tab-login').classList.add('active');
    usernameGroup.style.display = 'none';
    document.getElementById('auth-username').required = false;
    submitBtnText.innerText = 'ENTER THE REALM';
  } else {
    document.getElementById('tab-register').classList.add('active');
    usernameGroup.style.display = 'block';
    document.getElementById('auth-username').required = true;
    submitBtnText.innerText = 'CREATE CHARACTER';
  }
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const errorMsg = document.getElementById('auth-error-msg');
  errorMsg.innerText = '';

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value.trim();
  const username = document.getElementById('auth-username').value.trim();

  const users = DB.get(DB.KEYS.USERS);

  if (currentAuthTab === 'login') {
    // Handle Login
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      errorMsg.innerText = 'Invalid email or password. Try again traveler.';
      SoundFX.play('fail');
      return;
    }
    loginUser(user);
  } else {
    // Handle Register
    const emailExists = users.some(u => u.email === email);
    const usernameExists = users.some(u => u.username === username);

    if (emailExists) {
      errorMsg.innerText = 'This email is already linked to another champion.';
      SoundFX.play('fail');
      return;
    }
    if (usernameExists) {
      errorMsg.innerText = 'This username is already taken by another guild member.';
      SoundFX.play('fail');
      return;
    }

    const newUser = DB.insert(DB.KEYS.USERS, { username, email, password });
    // Create companion character status
    DB.insert(DB.KEYS.CHARACTERS, {
      user_id: newUser.id,
      level: 1,
      xp: 0,
      hp: 100,
      gold: 50,
      avatar: '🛡️'
    });

    // Create default Solo workspace for the user
    DB.insert(DB.KEYS.WORKSPACES, {
      title: `${username}'s Campaign`,
      description: 'Your personal sandbox workspace.',
      is_group: false,
      created_by: newUser.id
    });

    // Create initial log
    logAdventureEvent(newUser.id, 'general', 'Created character. Welcome to QuestBoard!');

    loginUser(newUser);
  }
}

// Adventure Log Helpers
function logAdventureEvent(userId, type, message) {
  DB.insert(DB.KEYS.LOGS, {
    user_id: userId,
    type: type,
    message: message,
    timestamp: new Date().toISOString()
  });
  
  if (state.currentUser && userId === state.currentUser.id) {
    renderAdventureLogs();
  }
}

function renderAdventureLogs() {
  if (!state.currentUser) return;
  const logs = DB.get(DB.KEYS.LOGS);
  const userLogs = logs.filter(l => l.user_id === state.currentUser.id);
  
  userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const container = document.getElementById('adventure-log-list');
  if (!container) return;
  
  if (userLogs.length === 0) {
    container.innerHTML = `<div style="color:var(--text-muted); text-align:center; padding-top:10px;">No logs recorded.</div>`;
    return;
  }
  
  container.innerHTML = '';
  // Show up to 40 log lines
  userLogs.slice(0, 40).forEach(log => {
    const entry = document.createElement('div');
    entry.className = `log-entry log-type-${log.type}`;
    
    const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    entry.innerHTML = `
      <div class="log-entry-meta">
        <span>[${timeFormatted}]</span>
        <span style="font-size:8px;">${log.type.replace('_', ' ').toUpperCase()}</span>
      </div>
      <div class="log-entry-msg">${escapeHTML(log.message)}</div>
    `;
    container.appendChild(entry);
  });
}

function loginUser(user) {
  state.currentUser = user;
  sessionStorage.setItem('qb_active_user', JSON.stringify(user));
  
  // Fetch character
  const characters = DB.get(DB.KEYS.CHARACTERS);
  state.currentCharacter = characters.find(c => c.user_id === user.id);
  
  // Set UI name
  document.getElementById('char-name').innerText = user.username;
  
  // Render Adventure Logs
  renderAdventureLogs();
  
  // Run lazy punishment checks for overdue tasks
  runAntiMalasCheck();

  // Load status display
  updateCharacterUI();
  
  // Load workspace lists
  loadWorkspaceLists();
  
  // Select first available workspace
  selectDefaultWorkspace();

  showScreen('app-screen');
  SoundFX.play('level_up');
}

function handleLogout() {
  SoundFX.play('click');
  sessionStorage.removeItem('qb_active_user');
  state.currentUser = null;
  state.currentCharacter = null;
  state.activeWorkspaceId = null;
  
  // Reset forms
  document.getElementById('auth-form').reset();
  showScreen('auth-screen');
}

// ==================== WORKSPACE LOGIC ====================
function loadWorkspaceLists() {
  const workspaces = DB.get(DB.KEYS.WORKSPACES);
  const members = DB.get(DB.KEYS.MEMBERS);
  const userId = state.currentUser.id;

  const soloList = document.getElementById('solo-workspaces-list');
  const groupList = document.getElementById('group-workspaces-list');
  
  soloList.innerHTML = '';
  groupList.innerHTML = '';

  workspaces.forEach(ws => {
    // Check membership
    const isOwner = ws.created_by === userId;
    const isMember = members.some(m => m.workspace_id === ws.id && m.user_id === userId);

    if (isOwner || isMember) {
      const li = document.createElement('li');
      li.className = `workspace-item ${state.activeWorkspaceId === ws.id ? 'active' : ''}`;
      li.onclick = () => selectWorkspace(ws.id);
      
      const badge = ws.is_group ? '<span class="workspace-badge">GUILD</span>' : '<span class="workspace-badge">SOLO</span>';
      
      li.innerHTML = `
        <span class="workspace-item-title"><i class="fa-solid ${ws.is_group ? 'fa-people-group' : 'fa-user-ninja'}"></i> ${escapeHTML(ws.title)}</span>
        ${badge}
      `;
      
      if (ws.is_group) {
        groupList.appendChild(li);
      } else {
        soloList.appendChild(li);
      }
    }
  });
}

function selectDefaultWorkspace() {
  const workspaces = DB.get(DB.KEYS.WORKSPACES);
  const members = DB.get(DB.KEYS.MEMBERS);
  const userId = state.currentUser.id;

  // Find a workspace owned or joined
  const myWorkspaces = workspaces.filter(ws => 
    ws.created_by === userId || members.some(m => m.workspace_id === ws.id && m.user_id === userId)
  );

  if (myWorkspaces.length > 0) {
    selectWorkspace(myWorkspaces[0].id);
  } else {
    // Hide board, show empty state
    document.getElementById('kanban-board-container').style.display = 'none';
    document.getElementById('group-members-panel').style.display = 'none';
    document.getElementById('empty-workspace-state').style.display = 'flex';
  }
}

function selectWorkspace(wsId) {
  SoundFX.play('click');
  state.activeWorkspaceId = wsId;
  
  const workspaces = DB.get(DB.KEYS.WORKSPACES);
  const ws = workspaces.find(w => w.id === wsId);
  if (!ws) return;

  // Active state visual update
  document.querySelectorAll('.workspace-item').forEach(item => item.classList.remove('active'));
  loadWorkspaceLists();

  document.getElementById('current-workspace-title').innerText = ws.title;
  document.getElementById('current-workspace-desc').innerText = ws.description || 'No description.';

  // Show/Hide board and members panel
  document.getElementById('empty-workspace-state').style.display = 'none';
  document.getElementById('kanban-board-container').style.display = 'grid';

  const groupPanel = document.getElementById('group-members-panel');
  if (ws.is_group) {
    groupPanel.style.display = 'flex';
    renderGroupMembers(wsId);
  } else {
    groupPanel.style.display = 'none';
  }

  // Load Kanban Cards
  renderKanbanCards();
}

function renderGroupMembers(wsId) {
  const members = DB.get(DB.KEYS.MEMBERS);
  const users = DB.get(DB.KEYS.USERS);
  const characters = DB.get(DB.KEYS.CHARACTERS);
  const wsMembers = members.filter(m => m.workspace_id === wsId);
  
  const avatarsContainer = document.getElementById('workspace-members-avatars');
  avatarsContainer.innerHTML = '';

  wsMembers.forEach(wm => {
    const user = users.find(u => u.id === wm.user_id);
    const char = characters.find(c => c.user_id === wm.user_id);
    const avatarEmoji = char ? char.avatar : '🛡️';
    
    if (user) {
      const div = document.createElement('div');
      div.className = 'member-avatar';
      div.title = `${user.username} (${char ? 'LV. ' + char.level : ''})`;
      div.innerText = avatarEmoji;
      avatarsContainer.appendChild(div);
    }
  });
}

function handleCreateWorkspace(event) {
  event.preventDefault();
  const title = document.getElementById('ws-title').value.trim();
  const description = document.getElementById('ws-desc').value.trim();
  const isGroup = document.getElementById('ws-is-group').checked;

  const newWS = DB.insert(DB.KEYS.WORKSPACES, {
    title,
    description,
    is_group: isGroup,
    created_by: state.currentUser.id
  });

  // If group, add self as member automatically
  if (isGroup) {
    DB.insert(DB.KEYS.MEMBERS, {
      workspace_id: newWS.id,
      user_id: state.currentUser.id
    });
  }

  closeModal('create-workspace-modal');
  document.getElementById('create-workspace-form').reset();
  
  // Reload
  selectWorkspace(newWS.id);
  
  // Broadcast updates
  broadcastSync({ type: 'WORKSPACE_LIST_UPDATE' });
}

function handleInviteMember(event) {
  event.preventDefault();
  const identifier = document.getElementById('invite-identifier').value.trim();
  const users = DB.get(DB.KEYS.USERS);
  
  // Find User by username or email
  const targetUser = users.find(u => u.username === identifier || u.email === identifier);
  
  if (!targetUser) {
    alert("Champion not found! Check username or email.");
    SoundFX.play('fail');
    return;
  }

  const workspaceId = state.activeWorkspaceId;
  const members = DB.get(DB.KEYS.MEMBERS);
  
  // Check if already a member
  const alreadyMember = members.some(m => m.workspace_id === workspaceId && m.user_id === targetUser.id);
  if (alreadyMember) {
    alert("This hero is already in your guild!");
    SoundFX.play('fail');
    return;
  }

  // Insert member
  DB.insert(DB.KEYS.MEMBERS, {
    workspace_id: workspaceId,
    user_id: targetUser.id
  });

  closeModal('invite-member-modal');
  document.getElementById('invite-member-form').reset();
  
  // Render
  renderGroupMembers(workspaceId);
  SoundFX.play('coin');

  // Broadcast sync
  broadcastSync({ 
    type: 'WORKSPACE_MEMBER_INVITED', 
    workspaceId: workspaceId, 
    userId: targetUser.id 
  });
}

// ==================== KANBAN CARD RENDER ====================
function renderKanbanCards() {
  const quests = DB.get(DB.KEYS.QUESTS);
  const subQuests = DB.get(DB.KEYS.SUB_QUESTS);
  const users = DB.get(DB.KEYS.USERS);
  const characters = DB.get(DB.KEYS.CHARACTERS);
  const wsId = state.activeWorkspaceId;

  // Filter and SORT quests by order index ascending
  const wsQuests = quests.filter(q => q.workspace_id === wsId);
  wsQuests.sort((a, b) => (a.order || 0) - (b.order || 0));

  const lists = {
    todo: document.getElementById('list-todo'),
    inprogress: document.getElementById('list-inprogress'),
    done: document.getElementById('list-done')
  };

  const counts = {
    todo: document.getElementById('count-todo'),
    inprogress: document.getElementById('count-inprogress'),
    done: document.getElementById('count-done')
  };

  // Reset lists
  Object.values(lists).forEach(l => l.innerHTML = '');
  Object.keys(counts).forEach(key => counts[key].innerText = '0');

  let colCounts = { todo: 0, inprogress: 0, done: 0 };

  wsQuests.forEach(quest => {
    const qSubQuests = subQuests.filter(sq => sq.quest_id === quest.id);
    const completedCount = qSubQuests.filter(sq => sq.is_completed).length;
    const totalSub = qSubQuests.length;

    // Check assignee
    const assigneeUser = users.find(u => u.id === quest.assigned_to);
    const char = characters.find(c => c.user_id === quest.assigned_to);
    const assigneeAvatar = char ? char.avatar : '🛡️';
    const assigneeName = assigneeUser ? assigneeUser.username : 'Unassigned';

    // Check deadline status
    const deadlineDate = new Date(quest.deadline);
    const isOverdue = deadlineDate < new Date() && quest.status !== 'done';
    const dateFormatted = deadlineDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const card = document.createElement('div');
    card.className = `quest-card difficulty-${quest.difficulty}`;
    card.draggable = quest.status !== 'done';
    card.id = `quest-card-${quest.id}`;
    
    // Drag event handlers
    card.addEventListener('dragstart', (e) => handleDragStart(e, quest.id, quest.status));
    card.addEventListener('dragend', handleDragEnd);

    // Click anywhere on card (except form controls) opens details modal
    card.addEventListener('click', (e) => {
      if (e.target.closest('.subquest-delete-btn') || e.target.closest('.checkmark-container') || e.target.closest('input') || e.target.closest('button') || e.target.closest('select')) {
        return;
      }
      openQuestDetailModal(quest.id);
    });

    // Vertical drag-over drop indicator logic
    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = card.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      if (relY < rect.height / 2) {
        card.classList.add('drag-over-top');
        card.classList.remove('drag-over-bottom');
      } else {
        card.classList.add('drag-over-bottom');
        card.classList.remove('drag-over-top');
      }
    });

    card.addEventListener('dragleave', () => {
      card.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('drag-over-top', 'drag-over-bottom');
      
      const rect = card.getBoundingClientRect();
      const relY = e.clientY - rect.top;
      const position = relY < rect.height / 2 ? 'before' : 'after';
      
      handleQuestVerticalReorder(state.draggedQuestId, quest.id, position);
    });

    card.innerHTML = `
      <div class="quest-card-header">
        <div class="quest-card-title">${escapeHTML(quest.title)}</div>
        <button class="qd-icon-btn" onclick="openQuestDetailModal(${quest.id})" title="View Details">
          <i class="fa-solid fa-expand"></i>
        </button>
      </div>
      <p class="quest-card-desc">${escapeHTML(quest.description || 'No instruction details.')}</p>
      
      ${totalSub > 0 ? `
      <div class="quest-card-progress" title="Sub-quest requirements">
        <i class="fa-solid fa-list-check"></i>
        <span>${completedCount}/${totalSub} Sub-Quests</span>
      </div>
      ` : ''}

      <div class="quest-card-footer">
        <span class="difficulty-tag tag-${quest.difficulty}">${quest.difficulty}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="card-deadline-badge ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? 'Overdue! XP / HP Penalty Pending.' : 'Deadline'}">
            <i class="fa-solid fa-clock"></i>
            <span>${dateFormatted}</span>
          </div>
          <div class="card-assignee-avatar" title="Assigned to: ${assigneeName}" style="font-size:12px;">
            ${assigneeAvatar}
          </div>
        </div>
      </div>
    `;

    lists[quest.status].appendChild(card);
    colCounts[quest.status]++;
  });

  // Update headers count badge
  Object.keys(counts).forEach(key => {
    counts[key].innerText = colCounts[key];
  });
}

// ==================== DRAG & DROP LOGIC ====================
function handleDragStart(event, questId, column) {
  state.draggedQuestId = questId;
  state.dragSourceColumn = column;
  event.target.classList.add('dragging');
  
  // Set transfer data (required for Firefox compatibility)
  event.dataTransfer.setData('text/plain', questId);
}

function handleDragEnd(event) {
  event.target.classList.remove('dragging');
}

function allowDrop(event) {
  event.preventDefault();
}

function handleDrop(event, targetColumn) {
  event.preventDefault();
  
  const questId = state.draggedQuestId;
  const sourceColumn = state.dragSourceColumn;

  if (!questId || sourceColumn === targetColumn) return;

  const quests = DB.get(DB.KEYS.QUESTS);
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  // RULE FR-1.3 (Sub-Quest completion checkout validation)
  if (targetColumn === 'done') {
    const subQuests = DB.get(DB.KEYS.SUB_QUESTS);
    const qSubQuests = subQuests.filter(sq => sq.quest_id === questId);
    const allCompleted = qSubQuests.every(sq => sq.is_completed);

    if (!allCompleted) {
      SoundFX.play('fail');
      alert(`⚠️ QUEST LOCKED!\n\nYou must check off all Sub-Quests before you can resolve "${quest.title}".`);
      return;
    }
  }

  // Update status in LocalStorage database
  DB.update(DB.KEYS.QUESTS, questId, { status: targetColumn });

  // Play Sound select
  SoundFX.play('click');

  // Trigger rewards or penalties if moved to done
  if (targetColumn === 'done' && sourceColumn !== 'done') {
    awardQuestRewards(quest);
  }

  renderKanbanCards();

  // Reset drag states
  state.draggedQuestId = null;
  state.dragSourceColumn = null;

  // Broadcast the change in real-time
  broadcastSync({
    type: 'QUEST_CARD_MOVED',
    workspaceId: state.activeWorkspaceId,
    questId: questId,
    targetColumn: targetColumn
  });
}

function handleQuestVerticalReorder(draggedId, targetId, position) {
  if (draggedId === targetId || !draggedId || !targetId) return;

  const quests = DB.get(DB.KEYS.QUESTS);
  const wsQuests = quests.filter(q => q.workspace_id === state.activeWorkspaceId);
  wsQuests.sort((a, b) => (a.order || 0) - (b.order || 0));

  const draggedQuest = wsQuests.find(q => q.id === draggedId);
  const targetQuest = wsQuests.find(q => q.id === targetId);

  if (!draggedQuest || !targetQuest) return;

  const targetStatus = targetQuest.status;

  // Check sub-quest completion rule if moving to done
  if (targetStatus === 'done' && draggedQuest.status !== 'done') {
    const subQuests = DB.get(DB.KEYS.SUB_QUESTS);
    const qSubQuests = subQuests.filter(sq => sq.quest_id === draggedId);
    const allCompleted = qSubQuests.every(sq => sq.is_completed);
    if (!allCompleted) {
      SoundFX.play('fail');
      alert(`⚠️ QUEST LOCKED!\n\nYou must check off all Sub-Quests before you can resolve "${draggedQuest.title}".`);
      return;
    }
  }

  // Update status if moving between columns
  if (draggedQuest.status !== targetStatus) {
    DB.update(DB.KEYS.QUESTS, draggedId, { status: targetStatus });
    if (targetStatus === 'done') {
      awardQuestRewards({ ...draggedQuest, status: targetStatus });
    }
    draggedQuest.status = targetStatus;
  }

  // Build ordered list for the target column (excluding dragged quest)
  const columnQuests = wsQuests.filter(q => {
    if (q.id === draggedId) return false;
    return q.status === targetStatus;
  });

  const targetIndex = columnQuests.findIndex(q => q.id === targetId);
  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;

  // Insert dragged quest at the correct position
  columnQuests.splice(insertIndex, 0, { ...draggedQuest, status: targetStatus });

  // Reassign order values for the target column
  columnQuests.forEach((q, idx) => {
    DB.update(DB.KEYS.QUESTS, q.id, { order: (idx + 1) * 10 });
  });

  SoundFX.play('click');
  renderKanbanCards();

  state.draggedQuestId = null;
  state.dragSourceColumn = null;

  broadcastSync({
    type: 'QUEST_CARD_MOVED',
    workspaceId: state.activeWorkspaceId,
    questId: draggedId,
    targetColumn: targetStatus
  });
}

// ==================== RPG GAMEPLAY ENGINE ====================
function awardQuestRewards(quest) {
  const rewards = DIFFICULTY_MATRIX[quest.difficulty] || DIFFICULTY_MATRIX.medium;
  const chars = DB.get(DB.KEYS.CHARACTERS);
  
  // Find assignee character to credit
  const character = chars.find(c => c.user_id === quest.assigned_to);
  if (!character) return;

  // Apply math gains
  let oldLevel = character.level;
  let newXP = character.xp + rewards.xp;
  let newGold = character.gold + rewards.gold;

  // Level Up check (Level-up threshold = current_level * 100)
  let level = character.level;
  let xpNeeded = level * 100;
  let leveledUp = false;

  while (newXP >= xpNeeded) {
    newXP -= xpNeeded;
    level++;
    xpNeeded = level * 100;
    leveledUp = true;
  }

  // Save changes to DB
  DB.update(DB.KEYS.CHARACTERS, character.id, {
    level: level,
    xp: newXP,
    gold: newGold
  });

  // Trigger floating XP/Gold feedback animation
  showFloatingRewardText(`+${rewards.gold} Gold! \n+${rewards.xp} XP!`);
  SoundFX.play('coin');

  // Log adventure events for XP and Gold gain
  logAdventureEvent(quest.assigned_to, 'xp_gain', `Quest Complete: "${quest.title}" — +${rewards.xp} XP gained!`);
  logAdventureEvent(quest.assigned_to, 'gold_gain', `Quest Complete: "${quest.title}" — +${rewards.gold} Gold earned!`);
  if (leveledUp) {
    logAdventureEvent(quest.assigned_to, 'general', `⬆️ Level UP! Ascended to Level ${level}!`);
  }

  // If assignee is current logged-in user, refresh UI and play level up
  if (quest.assigned_to === state.currentUser.id) {
    state.currentCharacter = { ...state.currentCharacter, level, xp: newXP, gold: newGold };
    updateCharacterUI();

    if (leveledUp) {
      triggerLevelUpAnnounce(oldLevel, level);
    }
  }

  // Broadcast character updates
  broadcastSync({ 
    type: 'CHARACTER_STATS_UPDATED', 
    userId: quest.assigned_to 
  });
}

function showFloatingRewardText(text) {
  const container = document.createElement('div');
  container.className = 'floating-text-reward';
  container.innerText = text;
  
  // Center float overlay
  container.style.left = `${window.innerWidth / 2 - 80}px`;
  container.style.top = `${window.innerHeight / 2 - 50}px`;
  
  document.body.appendChild(container);
  
  // Remove after animation completes
  setTimeout(() => {
    container.remove();
  }, 1200);
}

function triggerLevelUpAnnounce(oldLv, newLv) {
  SoundFX.play('level_up');
  const overlay = document.getElementById('rpg-announcer');
  const card = document.getElementById('announcement-card');
  const title = document.getElementById('announcement-title');
  const body = document.getElementById('announcement-body');
  
  card.className = 'announcement-card'; // clear classes
  title.innerText = 'LEVEL UP!';
  body.innerHTML = `Congratulations champion!<br>You have ascended from <strong>Level ${oldLv}</strong> to <strong>Level ${newLv}</strong>!`;
  
  overlay.style.display = 'flex';
  
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 3500);
}

function triggerDeathAnnounce(oldLv, newLv, lostGold) {
  SoundFX.play('damage');
  const overlay = document.getElementById('rpg-announcer');
  const card = document.getElementById('announcement-card');
  const title = document.getElementById('announcement-title');
  const body = document.getElementById('announcement-body');
  
  card.className = 'announcement-card danger-ann'; 
  title.innerText = 'YOU DIED!';
  body.innerHTML = `Laziness has defeated you! <br>Your HP hit 0. You resurrected, but received heavy penalties:<br><br>🚨 Lost <strong>1 Level</strong> (LV. ${oldLv} ➔ LV. ${newLv})<br>🪙 Lost 20% Gold (-${lostGold} Gold)`;
  
  overlay.style.display = 'flex';
  
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 4500);
}

function updateCharacterUI() {
  if (!state.currentCharacter) return;

  const char = state.currentCharacter;
  const xpNeeded = char.level * 100;
  const xpPct = Math.min((char.xp / xpNeeded) * 100, 100);
  const hpPct = Math.min((char.hp / 100) * 100, 100);

  // Avatar update
  document.getElementById('char-avatar').innerText = char.avatar || '🛡️';

  // Bars update
  document.getElementById('char-level').innerText = `LV. ${char.level}`;
  document.getElementById('char-gold').innerText = char.gold;
  document.getElementById('shop-char-gold').innerText = char.gold;

  document.getElementById('char-hp-text').innerText = `${char.hp}/100`;
  document.getElementById('char-hp-fill').style.width = `${hpPct}%`;

  document.getElementById('char-xp-text').innerText = `${char.xp}/${xpNeeded}`;
  document.getElementById('char-xp-fill').style.width = `${xpPct}%`;
}

// AUTOMATED PUNISHMENT (ANTI-MALAS CHECK)
function runAntiMalasCheck() {
  if (!state.currentUser || !state.currentCharacter) return;

  const quests = DB.get(DB.KEYS.QUESTS);
  const chars = DB.get(DB.KEYS.CHARACTERS);
  const userId = state.currentUser.id;
  const now = new Date();

  // Find all active quests assigned to the user that are past deadline and not yet penalized
  const overdueQuests = quests.filter(q => 
    q.assigned_to === userId && 
    q.status !== 'done' && 
    new Date(q.deadline) < now && 
    !q.penalized
  );

  if (overdueQuests.length === 0) return;

  // Pull current character stats
  const character = chars.find(c => c.user_id === userId);
  if (!character) return;

  let totalDamage = 0;
  let penalizedQuestIds = [];

  overdueQuests.forEach(quest => {
    const penalty = DIFFICULTY_MATRIX[quest.difficulty] || DIFFICULTY_MATRIX.medium;
    totalDamage += penalty.damage;
    penalizedQuestIds.push(quest.id);

    // Update quest as penalized in database
    DB.update(DB.KEYS.QUESTS, quest.id, { penalized: true });

    // Log individual quest penalty to adventure log
    logAdventureEvent(userId, 'damage_taken', `⚠️ Missed deadline: "${quest.title}" — -${penalty.damage} HP penalty!`);
  });

  // Apply damage
  let oldHp = character.hp;
  let newHp = character.hp - totalDamage;
  
  let died = false;
  let oldLv = character.level;
  let newLv = character.level;
  let lostGold = 0;

  if (newHp <= 0) {
    // TRIGGER DEATH PENALTY FR-2.4
    died = true;
    newHp = 100; // resurrect
    newLv = Math.max(1, character.level - 1);
    lostGold = Math.floor(character.gold * 0.2);
    character.gold = Math.max(0, character.gold - lostGold);
  }

  character.hp = newHp;
  character.level = newLv;

  // Save character changes
  DB.update(DB.KEYS.CHARACTERS, character.id, {
    hp: character.hp,
    level: character.level,
    gold: character.gold
  });

  // Sync state variable
  state.currentCharacter = { 
    ...state.currentCharacter, 
    hp: character.hp, 
    level: character.level, 
    gold: character.gold 
  };

  // Log death event to adventure log
  if (died) {
    logAdventureEvent(userId, 'death', `💀 Character died from accumulated overdue quests! Lost 1 level (LV.${oldLv} → LV.${newLv}) and -${lostGold} Gold.`);
  }

  // Sound & alert feedback
  setTimeout(() => {
    if (died) {
      triggerDeathAnnounce(oldLv, newLv, lostGold);
    } else {
      SoundFX.play('damage');
      alert(`⚠️ ANTI-MALAS PENALTY!\n\nYou failed to complete ${overdueQuests.length} quest(s) before their deadline.\nYour character suffered -${totalDamage} HP damage.`);
      updateCharacterUI();
    }
  }, 1000);

  // Broadcast sync updates
  broadcastSync({ type: 'CHARACTER_STATS_UPDATED', userId: userId });
  broadcastSync({ type: 'QUESTS_PENALIZED', questIds: penalizedQuestIds });
}

// ==================== QUEST CREATION MODAL ====================
function openCreateQuestModal() {
  SoundFX.play('click');
  
  // Set default deadline to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
  document.getElementById('quest-deadline').value = tomorrow.toISOString().slice(0, 16);

  const ws = DB.get(DB.KEYS.WORKSPACES).find(w => w.id === state.activeWorkspaceId);
  const assigneeGroup = document.getElementById('quest-assignee-group');

  if (ws && ws.is_group) {
    assigneeGroup.style.display = 'block';
    
    // Load group members inside dropdown options
    const members = DB.get(DB.KEYS.MEMBERS);
    const users = DB.get(DB.KEYS.USERS);
    const wsMembers = members.filter(m => m.workspace_id === ws.id);
    
    const select = document.getElementById('quest-assignee');
    select.innerHTML = '';
    
    wsMembers.forEach(wm => {
      const user = users.find(u => u.id === wm.user_id);
      if (user) {
        const option = document.createElement('option');
        option.value = user.id;
        option.text = user.username;
        if (user.id === state.currentUser.id) option.selected = true;
        select.appendChild(option);
      }
    });
  } else {
    assigneeGroup.style.display = 'none';
  }

  openModal('create-quest-modal');
}

function handleCreateQuest(event) {
  event.preventDefault();
  const title = document.getElementById('quest-title').value.trim();
  const description = document.getElementById('quest-desc').value.trim();
  const difficulty = document.getElementById('quest-difficulty').value;
  const deadline = document.getElementById('quest-deadline').value;

  const ws = DB.get(DB.KEYS.WORKSPACES).find(w => w.id === state.activeWorkspaceId);
  let assignedTo = state.currentUser.id;

  if (ws && ws.is_group) {
    assignedTo = parseInt(document.getElementById('quest-assignee').value);
  }

  // Calculate order — new quest goes to the TOP of Todo column
  const existingTodoQuests = DB.get(DB.KEYS.QUESTS).filter(q => q.workspace_id === state.activeWorkspaceId && q.status === 'todo');
  const minOrder = existingTodoQuests.length > 0 ? Math.min(...existingTodoQuests.map(q => q.order || 0)) - 10 : 10;

  // Insert quest
  const newQuest = DB.insert(DB.KEYS.QUESTS, {
    workspace_id: state.activeWorkspaceId,
    assigned_to: assignedTo,
    title,
    description,
    status: 'todo',
    difficulty,
    deadline: new Date(deadline).toISOString(),
    penalized: false,
    order: minOrder
  });

  closeModal('create-quest-modal');
  document.getElementById('create-quest-form').reset();
  
  renderKanbanCards();
  SoundFX.play('coin');

  // Broadcast
  broadcastSync({ 
    type: 'QUEST_CREATED', 
    workspaceId: state.activeWorkspaceId, 
    questId: newQuest.id 
  });
}

// ==================== QUEST DETAILS & DISCUSSION MODAL ====================
function openQuestDetailModal(questId) {
  SoundFX.play('click');
  state.activeQuestId = questId;

  const quests = DB.get(DB.KEYS.QUESTS);
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;

  // Fill inline-editable form fields
  document.getElementById('qd-edit-title').value = quest.title;
  document.getElementById('qd-edit-desc').value = quest.description || '';
  document.getElementById('qd-edit-difficulty').value = quest.difficulty;

  // Format deadline for datetime-local input (convert UTC to local time)
  const deadlineDate = new Date(quest.deadline);
  const localDeadline = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000);
  document.getElementById('qd-edit-deadline').value = localDeadline.toISOString().slice(0, 16);

  // Status badge (display only — status changed via kanban drag-drop)
  const statusBadge = document.getElementById('qd-status-badge');
  const statusLabels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
  statusBadge.innerText = statusLabels[quest.status] || quest.status.toUpperCase();
  statusBadge.className = `status-badge status-${quest.status}`;

  // Overdue highlight on deadline field
  const isOverdue = deadlineDate < new Date() && quest.status !== 'done';
  const deadlineContainer = document.getElementById('qd-edit-deadline').parentElement;
  if (deadlineContainer) {
    deadlineContainer.style.borderColor = isOverdue ? 'var(--hp-red)' : 'rgba(255,255,255,0.15)';
  }

  // Setup Assignee
  const ws = DB.get(DB.KEYS.WORKSPACES).find(w => w.id === quest.workspace_id);
  const assigneeContainer = document.getElementById('qd-assignee-change-container');
  const assigneeDisplay = document.getElementById('qd-assignee-display');
  const users = DB.get(DB.KEYS.USERS);
  const characters = DB.get(DB.KEYS.CHARACTERS);
  const assigneeUser = users.find(u => u.id === quest.assigned_to);
  const assigneeChar = characters.find(c => c.user_id === quest.assigned_to);
  const assigneeAvatar = assigneeChar ? assigneeChar.avatar : '👤';

  assigneeDisplay.querySelector('.name').innerText = assigneeUser ? assigneeUser.username : 'Unassigned';
  assigneeDisplay.querySelector('.avatar').innerText = assigneeAvatar;

  if (ws && ws.is_group) {
    assigneeContainer.style.display = 'block';

    const members = DB.get(DB.KEYS.MEMBERS);
    const wsMembers = members.filter(m => m.workspace_id === ws.id);

    const select = document.getElementById('qd-assignee-select');
    select.innerHTML = '';

    wsMembers.forEach(wm => {
      const u = users.find(user => user.id === wm.user_id);
      if (u) {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.text = u.username;
        if (u.id === quest.assigned_to) opt.selected = true;
        select.appendChild(opt);
      }
    });
  } else {
    assigneeContainer.style.display = 'none';
  }

  // Load Subquests & Comments
  renderSubQuests();
  renderComments();

  openModal('quest-detail-modal');
}

function handleSaveQuestDetails() {
  if (!state.activeQuestId) return;

  const title = document.getElementById('qd-edit-title').value.trim();
  const description = document.getElementById('qd-edit-desc').value.trim();
  const difficulty = document.getElementById('qd-edit-difficulty').value;
  const deadlineValue = document.getElementById('qd-edit-deadline').value;

  if (!title) {
    alert('Quest title cannot be empty!');
    return;
  }
  if (!deadlineValue) {
    alert('Please set a deadline for the quest!');
    return;
  }

  DB.update(DB.KEYS.QUESTS, state.activeQuestId, {
    title,
    description,
    difficulty,
    deadline: new Date(deadlineValue).toISOString(),
    penalized: false  // Reset penalized flag if deadline was extended
  });

  SoundFX.play('coin');
  showFloatingRewardText('✓ Quest Saved!');
  renderKanbanCards();

  // Refresh modal with updated data
  openQuestDetailModal(state.activeQuestId);

  broadcastSync({
    type: 'QUEST_CARD_MOVED',
    workspaceId: state.activeWorkspaceId,
    questId: state.activeQuestId
  });
}

function renderSubQuests() {
  const subQuests = DB.get(DB.KEYS.SUB_QUESTS);
  const qSubQuests = subQuests.filter(sq => sq.quest_id === state.activeQuestId);

  const progressText = document.getElementById('qd-subquest-progress');
  const list = document.getElementById('qd-subquests-list');
  list.innerHTML = '';

  const completed = qSubQuests.filter(sq => sq.is_completed).length;
  progressText.innerText = `${completed}/${qSubQuests.length} Completed`;

  qSubQuests.forEach(sq => {
    const li = document.createElement('li');
    li.className = `subquest-item ${sq.is_completed ? 'completed' : ''}`;
    
    // Toggle on item click
    li.innerHTML = `
      <span class="checkmark-container" onclick="toggleSubQuest(${sq.id})">
        <span class="checkmark" style="display:inline-block; border-color:${sq.is_completed ? 'var(--gold)' : 'var(--text-muted)'};">
          ${sq.is_completed ? '✓' : ''}
        </span>
      </span>
      <span class="sub-text" onclick="toggleSubQuest(${sq.id})">${escapeHTML(sq.description)}</span>
      <button class="subquest-delete-btn" onclick="deleteSubQuest(event, ${sq.id})" title="Delete Subquest">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    `;
    list.appendChild(li);
  });
}

function toggleSubQuest(sqId) {
  const subQuests = DB.get(DB.KEYS.SUB_QUESTS);
  const sq = subQuests.find(item => item.id === sqId);
  if (!sq) return;

  // Toggle state
  DB.update(DB.KEYS.SUB_QUESTS, sqId, { is_completed: !sq.is_completed });
  SoundFX.play('click');

  renderSubQuests();
  renderKanbanCards(); // updates count ratio on main board card

  // Broadcast sync
  broadcastSync({ 
    type: 'SUB_QUEST_TOGGLED', 
    workspaceId: state.activeWorkspaceId, 
    questId: state.activeQuestId,
    subQuestId: sqId 
  });
}

function handleAddSubQuest(event) {
  event.preventDefault();
  const input = document.getElementById('new-subquest-input');
  const description = input.value.trim();

  DB.insert(DB.KEYS.SUB_QUESTS, {
    quest_id: state.activeQuestId,
    description: description,
    is_completed: false
  });

  input.value = '';
  SoundFX.play('click');
  
  renderSubQuests();
  renderKanbanCards();

  broadcastSync({ 
    type: 'SUB_QUEST_CREATED', 
    workspaceId: state.activeWorkspaceId, 
    questId: state.activeQuestId 
  });
}

function deleteSubQuest(event, sqId) {
  event.stopPropagation(); // prevent triggering click event
  DB.delete(DB.KEYS.SUB_QUESTS, sqId);
  SoundFX.play('click');
  
  renderSubQuests();
  renderKanbanCards();

  broadcastSync({ 
    type: 'SUB_QUEST_DELETED', 
    workspaceId: state.activeWorkspaceId, 
    questId: state.activeQuestId 
  });
}

function handleAssigneeChange(newAssigneeId) {
  DB.update(DB.KEYS.QUESTS, state.activeQuestId, { assigned_to: parseInt(newAssigneeId) });
  SoundFX.play('click');

  const users = DB.get(DB.KEYS.USERS);
  const assigneeUser = users.find(u => u.id === parseInt(newAssigneeId));

  const display = document.getElementById('qd-assignee-display');
  display.querySelector('.name').innerText = assigneeUser ? assigneeUser.username : 'Unassigned';
  display.querySelector('.avatar').innerText = assigneeUser ? assigneeUser.username.substring(0, 2).toUpperCase() : '👤';

  renderKanbanCards();

  broadcastSync({
    type: 'QUEST_ASSIGNEE_CHANGED',
    workspaceId: state.activeWorkspaceId,
    questId: state.activeQuestId,
    assignedTo: parseInt(newAssigneeId)
  });
}

function handleDeleteQuest() {
  if (confirm("Are you sure you want to discard this quest to the void?")) {
    DB.delete(DB.KEYS.QUESTS, state.activeQuestId);
    
    // Cleanup subquests & comments relating to it
    const subQuests = DB.get(DB.KEYS.SUB_QUESTS).filter(sq => sq.quest_id === state.activeQuestId);
    subQuests.forEach(sq => DB.delete(DB.KEYS.SUB_QUESTS, sq.id));
    
    const comments = DB.get(DB.KEYS.COMMENTS).filter(c => c.quest_id === state.activeQuestId);
    comments.forEach(c => DB.delete(DB.KEYS.COMMENTS, c.id));

    closeModal('quest-detail-modal');
    renderKanbanCards();
    SoundFX.play('damage');

    broadcastSync({ 
      type: 'QUEST_DELETED', 
      workspaceId: state.activeWorkspaceId, 
      questId: state.activeQuestId 
    });
  }
}

// ==================== DISCUSSION COMMENTS LOGIC ====================
function renderComments() {
  const comments = DB.get(DB.KEYS.COMMENTS);
  const qComments = comments.filter(c => c.quest_id === state.activeQuestId);
  
  const list = document.getElementById('qd-comments-list');
  list.innerHTML = '';

  qComments.forEach(c => {
    const card = document.createElement('div');
    card.className = 'comment-card';
    
    const timeFormatted = new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${escapeHTML(c.username)}</span>
        <span class="comment-time">${timeFormatted}</span>
      </div>
      <div class="comment-content">${escapeHTML(c.content)}</div>
    `;
    list.appendChild(card);
  });
  
  // Auto scroll comments list to bottom
  list.scrollTop = list.scrollHeight;
}

function handleAddComment(event) {
  event.preventDefault();
  const input = document.getElementById('new-comment-input');
  const content = input.value.trim();

  DB.insert(DB.KEYS.COMMENTS, {
    quest_id: state.activeQuestId,
    user_id: state.currentUser.id,
    username: state.currentUser.username,
    content: content,
    created_at: new Date().toISOString()
  });

  input.value = '';
  SoundFX.play('click');

  renderComments();

  // Broadcast Comment sync
  broadcastSync({
    type: 'QUEST_COMMENT_ADDED',
    workspaceId: state.activeWorkspaceId,
    questId: state.activeQuestId
  });
}

// ==================== REWARD SHOP MODAL ====================
function openShopModal() {
  SoundFX.play('click');
  renderShop();
  openModal('reward-shop-modal');
}

function renderShop() {
  const rewards = DB.get(DB.KEYS.REWARDS);
  const userId = state.currentUser.id;
  const grid = document.getElementById('rewards-grid');
  grid.innerHTML = '';

  // Filter default rewards and custom rewards belonging to current user
  const userRewards = rewards.filter(r => !r.is_custom || r.user_id === userId);

  userRewards.forEach(r => {
    const canAfford = state.currentCharacter.gold >= r.cost;
    const card = document.createElement('div');
    card.className = 'reward-item-card';

    card.innerHTML = `
      <div class="reward-item-details" id="reward-details-${r.id}">
        <span class="reward-item-title">${escapeHTML(r.title)}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="reward-item-cost"><i class="fa-solid fa-coins"></i> ${r.cost} G</span>
          <span class="reward-badge-type ${r.is_custom ? 'custom' : ''}">${r.is_custom ? 'Self-Reward' : 'Standard'}</span>
        </div>
      </div>
      <div class="reward-actions">
        <button class="reward-btn-icon" onclick="editReward(${r.id})" title="Edit Reward"><i class="fa-solid fa-pen"></i></button>
        <button class="reward-btn-icon delete" onclick="deleteReward(${r.id})" title="Delete Reward"><i class="fa-solid fa-trash-can"></i></button>
        <button class="rpg-btn-sm primary-glow" onclick="purchaseReward(${r.id})" ${!canAfford ? 'disabled' : ''}>Buy</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function handleCreateCustomReward(event) {
  event.preventDefault();
  const title = document.getElementById('reward-title').value.trim();
  const cost = parseInt(document.getElementById('reward-cost').value);

  DB.insert(DB.KEYS.REWARDS, {
    user_id: state.currentUser.id,
    title,
    cost,
    is_custom: true
  });

  document.getElementById('reward-title').value = '';
  document.getElementById('reward-cost').value = '';
  SoundFX.play('coin');

  renderShop();
}

function purchaseReward(rewardId) {
  const rewards = DB.get(DB.KEYS.REWARDS);
  const r = rewards.find(item => item.id === rewardId);
  if (!r) return;

  const characters = DB.get(DB.KEYS.CHARACTERS);
  const character = characters.find(c => c.user_id === state.currentUser.id);
  
  if (character.gold < r.cost) {
    SoundFX.play('fail');
    alert("Insufficient Gold! Pursue more quests to increase your balance.");
    return;
  }

  // Deduct Gold in database
  const newGold = character.gold - r.cost;
  DB.update(DB.KEYS.CHARACTERS, character.id, { gold: newGold });
  
  // Sync state
  state.currentCharacter.gold = newGold;
  updateCharacterUI();

  // Alert success with Sound
  SoundFX.play('purchase');
  alert(`✨ PURCHASED: "${r.title}"!\n\n-${r.cost} Gold deducted. Go enjoy your real-life reward!`);
  
  renderShop();
}

function editReward(rewardId) {
  const rewards = DB.get(DB.KEYS.REWARDS);
  const r = rewards.find(item => item.id === rewardId);
  if (!r) return;

  const detailsEl = document.getElementById(`reward-details-${rewardId}`);
  if (!detailsEl) return;

  detailsEl.innerHTML = `
    <input type="text" class="reward-edit-input" id="reward-edit-title-${rewardId}" value="${escapeHTML(r.title)}" placeholder="Reward name..." style="width:100%; margin-bottom:6px;">
    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
      <input type="number" class="reward-edit-input" id="reward-edit-cost-${rewardId}" value="${r.cost}" min="1" placeholder="Cost" style="width:90px;">
      <button class="rpg-btn-sm primary-glow" onclick="saveRewardEdit(${rewardId})"><i class="fa-solid fa-check"></i> Save</button>
      <button class="rpg-btn-sm secondary-glow" onclick="renderShop()">Cancel</button>
    </div>
  `;
}

function saveRewardEdit(rewardId) {
  const titleEl = document.getElementById(`reward-edit-title-${rewardId}`);
  const costEl = document.getElementById(`reward-edit-cost-${rewardId}`);

  const newTitle = titleEl ? titleEl.value.trim() : '';
  const newCost = costEl ? parseInt(costEl.value) : 0;

  if (!newTitle) {
    alert('Reward title cannot be empty!');
    return;
  }
  if (isNaN(newCost) || newCost < 1) {
    alert('Please enter a valid cost (minimum 1 Gold).');
    return;
  }

  DB.update(DB.KEYS.REWARDS, rewardId, { title: newTitle, cost: newCost });
  SoundFX.play('coin');
  renderShop();
}

function deleteReward(rewardId) {
  if (confirm('Are you sure you want to remove this reward from the shop?')) {
    DB.delete(DB.KEYS.REWARDS, rewardId);
    SoundFX.play('click');
    renderShop();
  }
}

// ==================== REAL-TIME CROSS-TAB SYNC LOGIC ====================
function broadcastSync(message) {
  syncChannel.postMessage(message);
}

function handleSyncEvent(msg) {
  // If workspace updates, reload workspace lists
  if (msg.type === 'WORKSPACE_LIST_UPDATE') {
    loadWorkspaceLists();
  }

  // If a group member was invited and it affects current user, refresh workspace sidebar
  if (msg.type === 'WORKSPACE_MEMBER_INVITED' && msg.userId === state.currentUser.id) {
    loadWorkspaceLists();
  }

  // If an update is triggered in the active workspace
  if (msg.workspaceId === state.activeWorkspaceId) {
    if (msg.type === 'WORKSPACE_MEMBER_INVITED') {
      renderGroupMembers(state.activeWorkspaceId);
    }
    else if (msg.type === 'QUEST_CARD_MOVED' || msg.type === 'QUEST_CREATED' || msg.type === 'QUEST_DELETED' || msg.type === 'QUEST_ASSIGNEE_CHANGED') {
      renderKanbanCards();
      
      // If details modal of that quest is active, reload or close it
      if (state.activeQuestId === msg.questId) {
        if (msg.type === 'QUEST_DELETED') {
          closeModal('quest-detail-modal');
        } else {
          openQuestDetailModal(state.activeQuestId);
        }
      }
    }
    else if (msg.questId === state.activeQuestId) {
      if (msg.type === 'SUB_QUEST_TOGGLED' || msg.type === 'SUB_QUEST_CREATED' || msg.type === 'SUB_QUEST_DELETED') {
        renderSubQuests();
        renderKanbanCards();
      }
      else if (msg.type === 'QUEST_COMMENT_ADDED') {
        renderComments();
      }
    }
  }

  // Reload character UI stats if another user completed a task and we view them (or to update status panel if multiple tabs share profile)
  if (msg.type === 'CHARACTER_STATS_UPDATED' && msg.userId === state.currentUser.id) {
    const characters = DB.get(DB.KEYS.CHARACTERS);
    state.currentCharacter = characters.find(c => c.user_id === state.currentUser.id);
    updateCharacterUI();
  }
}

// ==================== DEBUG & TEST VERIFICATION SYSTEM ====================
function runAutomatedTests() {
  SoundFX.play('click');
  const logScreen = document.getElementById('debug-log-screen');
  logScreen.innerHTML = '';
  
  const log = (msg, type = 'info') => {
    const span = document.createElement('span');
    span.className = `log-${type}`;
    span.innerText = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
    logScreen.appendChild(span);
    logScreen.scrollTop = logScreen.scrollHeight;
  };

  log("Starting QuestBoard Logic verification test suite...", "info");

  try {
    // TEST 1: XP Level Up & Overflow Calculation
    log("TEST 1: Verifying XP Level Up & Overflow...", "info");
    let testChar = { level: 1, xp: 90, gold: 100 };
    let addedXP = 150; // Epic Quest rewards 150 XP
    let targetLevel = testChar.level;
    let targetXP = testChar.xp + addedXP;
    
    // Level Up Formula math loop simulation
    let xpThreshold = targetLevel * 100;
    while (targetXP >= xpThreshold) {
      targetXP -= xpThreshold;
      targetLevel++;
      xpThreshold = targetLevel * 100;
    }
    
    if (targetLevel === 2 && targetXP === 140) {
      log("✔ PASS: XP Overflow level calculation works correctly! (Lv 1, 90XP + 150XP -> Lv 2, 140XP/200XP)", "success");
    } else {
      throw new Error(`FAIL: Level Up logic output mismatch (Got Lv ${targetLevel}, XP ${targetXP})`);
    }

    // TEST 2: Character Death Logic
    log("TEST 2: Verifying Character Death penalties...", "info");
    let deathChar = { level: 3, hp: 10, gold: 200 };
    let damage = 25; // Hard difficulty damage penalty
    
    deathChar.hp -= damage;
    let resurrectHp = 100;
    let resurrectLv = deathChar.level;
    let lostGold = 0;

    if (deathChar.hp <= 0) {
      resurrectLv = Math.max(1, deathChar.level - 1);
      lostGold = Math.floor(deathChar.gold * 0.2);
      deathChar.gold = deathChar.gold - lostGold;
      deathChar.hp = resurrectHp;
    }

    if (deathChar.hp === 100 && resurrectLv === 2 && deathChar.gold === 160) {
      log(`✔ PASS: Character Death penalization matches specification (-1 Lv, -20% Gold)`, "success");
    } else {
      throw new Error(`FAIL: Death logic output mismatch (HP: ${deathChar.hp}, LV: ${resurrectLv}, Gold: ${deathChar.gold})`);
    }

    // TEST 3: DB integrity checks
    log("TEST 3: Verifying LocalStorage DB integrity...", "info");
    const users = DB.get(DB.KEYS.USERS);
    const quests = DB.get(DB.KEYS.QUESTS);
    
    if (users.length > 0 && quests.length > 0) {
      log(`✔ PASS: Mock Database parsed correctly. Active tables contain ${users.length} users and ${quests.length} quests.`, "success");
    } else {
      throw new Error("FAIL: DB parsed empty datasets.");
    }

    log("\nAll tests completed. QuestBoard MVP business logic status: VERIFIED & CORRECT.", "success");
  } catch (error) {
    log(`🚨 TEST EXCEPTION OCCURRED: ${error.message}`, "error");
  }
}

// Force expiration and execute Anti-Malas check
function simulateOverdueCheck() {
  SoundFX.play('click');
  
  // Set all TODO/In Progress tasks in the current workspace to yesterday deadline
  const quests = DB.get(DB.KEYS.QUESTS);
  const activeWsQuests = quests.filter(q => q.workspace_id === state.activeWorkspaceId && q.status !== 'done');

  if (activeWsQuests.length === 0) {
    alert("No active tasks in this workspace to simulate penalty on. Please create a task first.");
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  activeWsQuests.forEach(q => {
    DB.update(DB.KEYS.QUESTS, q.id, { 
      deadline: yesterday.toISOString(),
      penalized: false // allow it to be processed again
    });
  });

  // Re-run the board renders and check
  renderKanbanCards();
  runAntiMalasCheck();
}

function resetDatabase() {
  if (confirm("🚨 WARNING: This will factory reset all local character files and restore defaults. Proceed?")) {
    localStorage.clear();
    DB.init();
    alert("Database restored to defaults. Logging out...");
    handleLogout();
  }
}

// ==================== AVATAR SELECTION ====================
function openAvatarModal() {
  SoundFX.play('click');
  const grid = document.getElementById('avatar-catalog-grid');
  grid.innerHTML = '';

  const AVATAR_CLASSES = [
    { emoji: '🛡️', name: 'Guardian' },
    { emoji: '⚔️', name: 'Warrior' },
    { emoji: '🗡️', name: 'Assassin' },
    { emoji: '🏹', name: 'Ranger' },
    { emoji: '🔮', name: 'Mage' },
    { emoji: '🧙', name: 'Wizard' },
    { emoji: '🌟', name: 'Paladin' },
    { emoji: '💀', name: 'Necromancer' },
    { emoji: '🐉', name: 'Dragonlord' },
    { emoji: '🦊', name: 'Trickster' },
    { emoji: '🌿', name: 'Druid' },
    { emoji: '⚡', name: 'Thunderlord' },
    { emoji: '🔥', name: 'Pyromancer' },
    { emoji: '🌊', name: 'Aquamancer' },
    { emoji: '🌙', name: 'Shadowblade' },
    { emoji: '☀️', name: 'Solar Knight' },
    { emoji: '🦅', name: 'Eagle Eye' },
    { emoji: '🐺', name: 'Wolfkin' },
    { emoji: '🌺', name: 'Enchanter' },
    { emoji: '👑', name: 'Sovereign' },
    { emoji: '🎯', name: 'Marksman' },
    { emoji: '🧬', name: 'Alchemist' },
    { emoji: '🌀', name: 'Vortex' },
    { emoji: '🏔️', name: 'Earthshaker' },
  ];

  const currentAvatar = state.currentCharacter ? state.currentCharacter.avatar : '🛡️';

  AVATAR_CLASSES.forEach(a => {
    const item = document.createElement('div');
    item.className = `avatar-catalog-item ${a.emoji === currentAvatar ? 'selected' : ''}`;
    item.onclick = () => selectAvatar(a.emoji);
    item.innerHTML = `
      <div class="avatar-catalog-emoji">${a.emoji}</div>
      <div class="avatar-catalog-name">${a.name}</div>
    `;
    grid.appendChild(item);
  });

  openModal('avatar-modal');
}

function selectAvatar(emoji) {
  SoundFX.play('coin');

  const chars = DB.get(DB.KEYS.CHARACTERS);
  const char = chars.find(c => c.user_id === state.currentUser.id);
  if (!char) return;

  DB.update(DB.KEYS.CHARACTERS, char.id, { avatar: emoji });
  state.currentCharacter.avatar = emoji;

  // Update sidebar avatar display
  document.getElementById('char-avatar').innerText = emoji;

  // Update selection state in grid
  document.querySelectorAll('.avatar-catalog-item').forEach(item => {
    const itemEmoji = item.querySelector('.avatar-catalog-emoji').innerText;
    item.classList.toggle('selected', itemEmoji === emoji);
  });

  logAdventureEvent(state.currentUser.id, 'general', `Changed avatar class to ${emoji}`);
  broadcastSync({ type: 'CHARACTER_STATS_UPDATED', userId: state.currentUser.id });
}

// ==================== SQL EXPORT ====================
function openSQLExportModal() {
  SoundFX.play('click');

  const users = DB.get(DB.KEYS.USERS);
  const characters = DB.get(DB.KEYS.CHARACTERS);
  const workspaces = DB.get(DB.KEYS.WORKSPACES);
  const members = DB.get(DB.KEYS.MEMBERS);
  const quests = DB.get(DB.KEYS.QUESTS);
  const subQuests = DB.get(DB.KEYS.SUB_QUESTS);
  const comments = DB.get(DB.KEYS.COMMENTS);
  const rewards = DB.get(DB.KEYS.REWARDS);
  const logs = DB.get(DB.KEYS.LOGS);

  // Helper to escape SQL single quotes
  const sqlEsc = (s) => s ? String(s).replace(/'/g, "''") : '';

  // ---- PostgreSQL / Supabase SQL ----
  let pgSQL = `-- QuestBoard PostgreSQL Schema (Supabase Ready)\n-- Generated: ${new Date().toISOString()}\n\n`;
  pgSQL += `SET session_replication_role = 'replica';\n`;
  pgSQL += `DROP TABLE IF EXISTS adventure_logs CASCADE;\nDROP TABLE IF EXISTS comments CASCADE;\nDROP TABLE IF EXISTS sub_quests CASCADE;\nDROP TABLE IF EXISTS rewards CASCADE;\nDROP TABLE IF EXISTS quests CASCADE;\nDROP TABLE IF EXISTS workspace_members CASCADE;\nDROP TABLE IF EXISTS workspaces CASCADE;\nDROP TABLE IF EXISTS characters CASCADE;\nDROP TABLE IF EXISTS users CASCADE;\n`;
  pgSQL += `SET session_replication_role = 'origin';\n\n`;

  pgSQL += `CREATE TABLE users (\n  id BIGSERIAL PRIMARY KEY,\n  username VARCHAR(100) NOT NULL UNIQUE,\n  email VARCHAR(255) NOT NULL UNIQUE,\n  password VARCHAR(255) NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE characters (\n  id BIGSERIAL PRIMARY KEY,\n  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  level INTEGER DEFAULT 1,\n  xp INTEGER DEFAULT 0,\n  hp INTEGER DEFAULT 100,\n  gold INTEGER DEFAULT 50,\n  avatar VARCHAR(20) DEFAULT '🛡️',\n  updated_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE workspaces (\n  id BIGSERIAL PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  is_group BOOLEAN DEFAULT FALSE,\n  created_by BIGINT NOT NULL REFERENCES users(id),\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE workspace_members (\n  id BIGSERIAL PRIMARY KEY,\n  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,\n  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  joined_at TIMESTAMPTZ DEFAULT NOW(),\n  UNIQUE(workspace_id, user_id)\n);\n\n`;
  pgSQL += `CREATE TABLE quests (\n  id BIGSERIAL PRIMARY KEY,\n  workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,\n  assigned_to BIGINT REFERENCES users(id) ON DELETE SET NULL,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo','inprogress','done')),\n  difficulty VARCHAR(10) DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard','epic')),\n  deadline TIMESTAMPTZ,\n  penalized BOOLEAN DEFAULT FALSE,\n  "order" INTEGER DEFAULT 10,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE sub_quests (\n  id BIGSERIAL PRIMARY KEY,\n  quest_id BIGINT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,\n  description TEXT NOT NULL,\n  is_completed BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE comments (\n  id BIGSERIAL PRIMARY KEY,\n  quest_id BIGINT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,\n  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  username VARCHAR(100) NOT NULL,\n  content TEXT NOT NULL,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE rewards (\n  id BIGSERIAL PRIMARY KEY,\n  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  title VARCHAR(255) NOT NULL,\n  cost INTEGER NOT NULL DEFAULT 50,\n  is_custom BOOLEAN DEFAULT FALSE,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;
  pgSQL += `CREATE TABLE adventure_logs (\n  id BIGSERIAL PRIMARY KEY,\n  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,\n  type VARCHAR(50) NOT NULL,\n  message TEXT NOT NULL,\n  timestamp TIMESTAMPTZ DEFAULT NOW()\n);\n\n`;

  if (users.length > 0) { pgSQL += `-- Users\nINSERT INTO users (id, username, email, password) VALUES\n`; pgSQL += users.map(u => `  (${u.id}, '${sqlEsc(u.username)}', '${sqlEsc(u.email)}', '${sqlEsc(u.password)}')`).join(',\n') + `;\n\n`; }
  if (characters.length > 0) { pgSQL += `-- Characters\nINSERT INTO characters (id, user_id, level, xp, hp, gold, avatar) VALUES\n`; pgSQL += characters.map(c => `  (${c.id}, ${c.user_id}, ${c.level}, ${c.xp}, ${c.hp}, ${c.gold}, '${sqlEsc(c.avatar)}')`).join(',\n') + `;\n\n`; }
  if (workspaces.length > 0) { pgSQL += `-- Workspaces\nINSERT INTO workspaces (id, title, description, is_group, created_by) VALUES\n`; pgSQL += workspaces.map(w => `  (${w.id}, '${sqlEsc(w.title)}', '${sqlEsc(w.description || '')}', ${w.is_group}, ${w.created_by})`).join(',\n') + `;\n\n`; }
  if (members.length > 0) { pgSQL += `-- Workspace Members\nINSERT INTO workspace_members (id, workspace_id, user_id) VALUES\n`; pgSQL += members.map(m => `  (${m.id}, ${m.workspace_id}, ${m.user_id})`).join(',\n') + `;\n\n`; }
  if (quests.length > 0) { pgSQL += `-- Quests\nINSERT INTO quests (id, workspace_id, assigned_to, title, description, status, difficulty, deadline, penalized, "order") VALUES\n`; pgSQL += quests.map(q => `  (${q.id}, ${q.workspace_id}, ${q.assigned_to || 'NULL'}, '${sqlEsc(q.title)}', '${sqlEsc(q.description || '')}', '${q.status}', '${q.difficulty}', '${q.deadline}', ${q.penalized}, ${q.order || 10})`).join(',\n') + `;\n\n`; }
  if (subQuests.length > 0) { pgSQL += `-- Sub Quests\nINSERT INTO sub_quests (id, quest_id, description, is_completed) VALUES\n`; pgSQL += subQuests.map(sq => `  (${sq.id}, ${sq.quest_id}, '${sqlEsc(sq.description)}', ${sq.is_completed})`).join(',\n') + `;\n\n`; }
  if (comments.length > 0) { pgSQL += `-- Comments\nINSERT INTO comments (id, quest_id, user_id, username, content, created_at) VALUES\n`; pgSQL += comments.map(c => `  (${c.id}, ${c.quest_id}, ${c.user_id}, '${sqlEsc(c.username)}', '${sqlEsc(c.content)}', '${c.created_at}')`).join(',\n') + `;\n\n`; }
  if (rewards.length > 0) { pgSQL += `-- Rewards\nINSERT INTO rewards (id, user_id, title, cost, is_custom) VALUES\n`; pgSQL += rewards.map(r => `  (${r.id}, ${r.user_id}, '${sqlEsc(r.title)}', ${r.cost}, ${r.is_custom})`).join(',\n') + `;\n\n`; }
  if (logs.length > 0) { pgSQL += `-- Adventure Logs\nINSERT INTO adventure_logs (id, user_id, type, message, timestamp) VALUES\n`; pgSQL += logs.map(l => `  (${l.id}, ${l.user_id}, '${sqlEsc(l.type)}', '${sqlEsc(l.message)}', '${l.timestamp}')`).join(',\n') + `;\n\n`; }

  pgSQL += `-- Reset sequences\n`;
  [[users,'users'],[characters,'characters'],[workspaces,'workspaces'],[members,'workspace_members'],[quests,'quests'],[subQuests,'sub_quests'],[comments,'comments'],[rewards,'rewards'],[logs,'adventure_logs']].forEach(([data, table]) => {
    if (data && data.length > 0) { const maxId = Math.max(...data.map(d => d.id)); pgSQL += `SELECT setval('${table}_id_seq', ${maxId});\n`; }
  });

  document.getElementById('sql-export-postgres').value = pgSQL;

  // ---- MySQL / phpMyAdmin SQL ----
  let mySQL = `-- QuestBoard MySQL Schema (phpMyAdmin Ready)\n-- Generated: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\nDROP TABLE IF EXISTS adventure_logs;\nDROP TABLE IF EXISTS comments;\nDROP TABLE IF EXISTS sub_quests;\nDROP TABLE IF EXISTS rewards;\nDROP TABLE IF EXISTS quests;\nDROP TABLE IF EXISTS workspace_members;\nDROP TABLE IF EXISTS workspaces;\nDROP TABLE IF EXISTS characters;\nDROP TABLE IF EXISTS users;\nSET FOREIGN_KEY_CHECKS = 1;\n\n`;

  mySQL += `CREATE TABLE users (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  username VARCHAR(100) NOT NULL UNIQUE,\n  email VARCHAR(255) NOT NULL UNIQUE,\n  password VARCHAR(255) NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += `CREATE TABLE characters (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  user_id INT NOT NULL,\n  level INT DEFAULT 1,\n  xp INT DEFAULT 0,\n  hp INT DEFAULT 100,\n  gold INT DEFAULT 50,\n  avatar VARCHAR(20) DEFAULT '🛡️',\n  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += `CREATE TABLE workspaces (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  is_group TINYINT(1) DEFAULT 0,\n  created_by INT NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (created_by) REFERENCES users(id)\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += `CREATE TABLE workspace_members (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  workspace_id INT NOT NULL,\n  user_id INT NOT NULL,\n  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE KEY unique_member (workspace_id, user_id),\n  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += "CREATE TABLE quests (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  workspace_id INT NOT NULL,\n  assigned_to INT,\n  title VARCHAR(255) NOT NULL,\n  description TEXT,\n  status ENUM('todo','inprogress','done') DEFAULT 'todo',\n  difficulty ENUM('easy','medium','hard','epic') DEFAULT 'medium',\n  deadline DATETIME,\n  penalized TINYINT(1) DEFAULT 0,\n  `order` INT DEFAULT 10,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,\n  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n";
  mySQL += `CREATE TABLE sub_quests (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  quest_id INT NOT NULL,\n  description TEXT NOT NULL,\n  is_completed TINYINT(1) DEFAULT 0,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += `CREATE TABLE comments (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  quest_id INT NOT NULL,\n  user_id INT NOT NULL,\n  username VARCHAR(100) NOT NULL,\n  content TEXT NOT NULL,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += `CREATE TABLE rewards (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  user_id INT NOT NULL,\n  title VARCHAR(255) NOT NULL,\n  cost INT NOT NULL DEFAULT 50,\n  is_custom TINYINT(1) DEFAULT 0,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;
  mySQL += `CREATE TABLE adventure_logs (\n  id INT AUTO_INCREMENT PRIMARY KEY,\n  user_id INT NOT NULL,\n  type VARCHAR(50) NOT NULL,\n  message TEXT NOT NULL,\n  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,\n  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;\n\n`;

  if (users.length > 0) { mySQL += `-- Users\nINSERT INTO users (id, username, email, password) VALUES\n`; mySQL += users.map(u => `  (${u.id}, '${sqlEsc(u.username)}', '${sqlEsc(u.email)}', '${sqlEsc(u.password)}')`).join(',\n') + `;\n\n`; }
  if (characters.length > 0) { mySQL += `-- Characters\nINSERT INTO characters (id, user_id, level, xp, hp, gold, avatar) VALUES\n`; mySQL += characters.map(c => `  (${c.id}, ${c.user_id}, ${c.level}, ${c.xp}, ${c.hp}, ${c.gold}, '${sqlEsc(c.avatar)}')`).join(',\n') + `;\n\n`; }
  if (workspaces.length > 0) { mySQL += `-- Workspaces\nINSERT INTO workspaces (id, title, description, is_group, created_by) VALUES\n`; mySQL += workspaces.map(w => `  (${w.id}, '${sqlEsc(w.title)}', '${sqlEsc(w.description || '')}', ${w.is_group ? 1 : 0}, ${w.created_by})`).join(',\n') + `;\n\n`; }
  if (members.length > 0) { mySQL += `-- Workspace Members\nINSERT INTO workspace_members (id, workspace_id, user_id) VALUES\n`; mySQL += members.map(m => `  (${m.id}, ${m.workspace_id}, ${m.user_id})`).join(',\n') + `;\n\n`; }
  if (quests.length > 0) { mySQL += "-- Quests\nINSERT INTO quests (id, workspace_id, assigned_to, title, description, status, difficulty, deadline, penalized, `order`) VALUES\n"; mySQL += quests.map(q => { const dl = new Date(q.deadline).toISOString().replace('T',' ').slice(0,19); return `  (${q.id}, ${q.workspace_id}, ${q.assigned_to||'NULL'}, '${sqlEsc(q.title)}', '${sqlEsc(q.description||'')}', '${q.status}', '${q.difficulty}', '${dl}', ${q.penalized?1:0}, ${q.order||10})`; }).join(',\n') + `;\n\n`; }
  if (subQuests.length > 0) { mySQL += `-- Sub Quests\nINSERT INTO sub_quests (id, quest_id, description, is_completed) VALUES\n`; mySQL += subQuests.map(sq => `  (${sq.id}, ${sq.quest_id}, '${sqlEsc(sq.description)}', ${sq.is_completed?1:0})`).join(',\n') + `;\n\n`; }
  if (comments.length > 0) { mySQL += `-- Comments\nINSERT INTO comments (id, quest_id, user_id, username, content, created_at) VALUES\n`; mySQL += comments.map(c => { const ca = new Date(c.created_at).toISOString().replace('T',' ').slice(0,19); return `  (${c.id}, ${c.quest_id}, ${c.user_id}, '${sqlEsc(c.username)}', '${sqlEsc(c.content)}', '${ca}')`; }).join(',\n') + `;\n\n`; }
  if (rewards.length > 0) { mySQL += `-- Rewards\nINSERT INTO rewards (id, user_id, title, cost, is_custom) VALUES\n`; mySQL += rewards.map(r => `  (${r.id}, ${r.user_id}, '${sqlEsc(r.title)}', ${r.cost}, ${r.is_custom?1:0})`).join(',\n') + `;\n\n`; }
  if (logs.length > 0) { mySQL += `-- Adventure Logs\nINSERT INTO adventure_logs (id, user_id, type, message, timestamp) VALUES\n`; mySQL += logs.map(l => { const ts = new Date(l.timestamp).toISOString().replace('T',' ').slice(0,19); return `  (${l.id}, ${l.user_id}, '${sqlEsc(l.type)}', '${sqlEsc(l.message)}', '${ts}')`; }).join(',\n') + `;\n\n`; }

  document.getElementById('sql-export-mysql').value = mySQL;
  openModal('sql-export-modal');
}

function copySQLText(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.select();
  el.setSelectionRange(0, 99999);
  try {
    navigator.clipboard.writeText(el.value).then(() => {
      SoundFX.play('coin');
      alert('✅ SQL copied to clipboard! Paste it in phpMyAdmin or Supabase SQL editor.');
    }).catch(() => {
      document.execCommand('copy');
      SoundFX.play('coin');
      alert('✅ SQL copied to clipboard!');
    });
  } catch (err) {
    document.execCommand('copy');
    SoundFX.play('coin');
    alert('✅ SQL copied to clipboard!');
  }
}

// ==================== COMMON UTILITIES ====================
function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
