export const notionApi = {
  async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('peerlearn_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      if (res.status === 401) {
        // If we get 401, token might be revoked
        const err = await res.json();
        if (err.action === 'reconnect_notion') {
          // Trigger a global event or callback to update UI
          window.dispatchEvent(new CustomEvent('notion-revoked'));
        }
        throw new Error(err.error || 'API Request Failed');
      }
      const err = await res.json();
      throw new Error(err.error || 'API Request Failed');
    }
    return res.json();
  },

  // Connection management
  async getStatus() {
    return this.fetchWithAuth('/api/notion/status');
  },
  async getConnectUrl() {
    return this.fetchWithAuth('/api/notion/oauth');
  },
  async disconnect() {
    return this.fetchWithAuth('/api/notion/disconnect', { method: 'POST' });
  },
  async sync() {
    return this.fetchWithAuth('/api/notion/sync', { method: 'POST' });
  },

  // Notes
  async createNote(title, content, subject, is_public = false) {
    return this.fetchWithAuth('/api/notion/notes', {
      method: 'POST', body: JSON.stringify({ title, content, subject, is_public })
    });
  },
  async getNotes() {
    return this.fetchWithAuth('/api/notion/notes');
  },
  async updateNote(id, updates) {
    return this.fetchWithAuth('/api/notion/notes', {
      method: 'PATCH', body: JSON.stringify({ id, ...updates })
    });
  },
  async deleteNote(id) {
    return this.fetchWithAuth('/api/notion/notes', {
      method: 'DELETE', body: JSON.stringify({ id })
    });
  },

  // Todos
  async createTodo(title, status, due_date) {
    return this.fetchWithAuth('/api/notion/todos', {
      method: 'POST', body: JSON.stringify({ title, status, due_date })
    });
  },
  async getTodos() {
    return this.fetchWithAuth('/api/notion/todos');
  },
  async updateTodo(id, updates) {
    return this.fetchWithAuth('/api/notion/todos', {
      method: 'PATCH', body: JSON.stringify({ id, ...updates })
    });
  },
  async deleteTodo(id) {
    return this.fetchWithAuth('/api/notion/todos', {
      method: 'DELETE', body: JSON.stringify({ id })
    });
  },

  // Events
  async createEvent(title, event_type, date) {
    return this.fetchWithAuth('/api/notion/events', {
      method: 'POST', body: JSON.stringify({ title, event_type, date })
    });
  },
  async getEvents() {
    return this.fetchWithAuth('/api/notion/events');
  },
  async updateEvent(id, updates) {
    return this.fetchWithAuth('/api/notion/events', {
      method: 'PATCH', body: JSON.stringify({ id, ...updates })
    });
  },
  async deleteEvent(id) {
    return this.fetchWithAuth('/api/notion/events', {
      method: 'DELETE', body: JSON.stringify({ id })
    });
  }
};
