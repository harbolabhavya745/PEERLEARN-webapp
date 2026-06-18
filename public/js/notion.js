export const notionApi = {
  async fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('peerlearn_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'API Request Failed');
    }
    return res.json();
  },

  async createNote(title, content, subject, is_public = false) {
    return this.fetchWithAuth('/api/notion/notes', {
      method: 'POST', body: JSON.stringify({ title, content, subject, is_public })
    });
  },
  async getNotes() {
    return this.fetchWithAuth('/api/notion/notes');
  },

  async createTodo(title, status, due_date) {
    return this.fetchWithAuth('/api/notion/todos', {
      method: 'POST', body: JSON.stringify({ title, status, due_date })
    });
  },
  async getTodos() {
    return this.fetchWithAuth('/api/notion/todos');
  },

  async createEvent(title, event_type, date) {
    return this.fetchWithAuth('/api/notion/events', {
      method: 'POST', body: JSON.stringify({ title, event_type, date })
    });
  },
  async getEvents() {
    return this.fetchWithAuth('/api/notion/events');
  }
};
