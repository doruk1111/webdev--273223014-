async function errorText(res, fallback) {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch (e) {
    return fallback;
  }
}

async function loadSessions() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const emptyEl = document.getElementById('empty');
  const listEl = document.getElementById('sessions-list');
  const groupTitleEl = document.getElementById('group-title');
  const addSessionContainer = document.getElementById('add-session-container');
  const addSessionForm = document.getElementById('add-session-form');
  const formErrorEl = document.getElementById('form-error');

  const params = new URLSearchParams(window.location.search);
  const groupId = params.get('group');

  if (!groupId) {
    loadingEl.style.display = 'none';
    errorEl.textContent = 'Missing group ID in query string.';
    errorEl.style.display = 'block';
    return;
  }

  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  emptyEl.style.display = 'none';
  addSessionContainer.style.display = 'none';
  listEl.textContent = '';

  try {
    const [meRes, groupsRes, sessionsRes] = await Promise.all([
      fetch('/api/me'),
      fetch('/api/groups'),
      fetch(`/api/groups/${groupId}/sessions`)
    ]);

    if (meRes.status === 401 || groupsRes.status === 401 || sessionsRes.status === 401) {
      window.location.href = '/login';
      return;
    }

    if (!meRes.ok || !groupsRes.ok || !sessionsRes.ok) {
      throw new Error('Failed to load session data');
    }

    const user = await meRes.json();
    const groups = await groupsRes.json();
    const sessions = await sessionsRes.json();

    loadingEl.style.display = 'none';

    const group = groups.find((g) => String(g.id) === String(groupId));
    if (!group) {
      errorEl.textContent = 'Group not found.';
      errorEl.style.display = 'block';
      return;
    }

    groupTitleEl.textContent = `Study Sessions: ${group.name} (${group.course})`;

    if (user && group && user.id === group.owner_id) {
      addSessionContainer.style.display = 'block';
    }
    const suggestButton = document.getElementById('suggest-agenda');
const topicInput = document.getElementById('topic');
const agendaNote = document.getElementById('agenda-note');
const agendaSuggestion = document.getElementById('agenda-suggestion');

suggestButton.addEventListener('click', async () => {
  agendaNote.style.display = 'none';
  agendaSuggestion.style.display = 'none';
  formErrorEl.style.display = 'none';

  if (!topicInput.value.trim()) {
    agendaNote.textContent = 'Please enter a session topic first.';
    agendaNote.style.display = 'block';
    return;
  }

  suggestButton.disabled = true;
  suggestButton.textContent = 'Generating...';

  try {
    const response = await fetch(
      `/api/groups/${groupId}/agenda-suggestion`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topicInput.value.trim() })
      }
    );

    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Could not generate suggestion');
    }

    if (result.title || result.agenda.length > 0) {
      document.getElementById('suggested-title').value = result.title;
      document.getElementById('suggested-agenda').value =
        result.agenda.join('\n');

      agendaSuggestion.style.display = 'block';
    }

    if (result.note) {
      agendaNote.textContent = result.note;
      agendaNote.style.display = 'block';
    }
  } catch (err) {
    agendaNote.textContent =
      'AI suggestions are unavailable. Please enter the details manually.';
    agendaNote.style.display = 'block';
  } finally {
    suggestButton.disabled = false;
    suggestButton.textContent = 'Suggest with AI';
  }
});

    if (!sessions || sessions.length === 0) {
      emptyEl.style.display = 'block';
    } else {
      sessions.forEach((session) => {
        const li = document.createElement('li');

        const textSpan = document.createElement('span');
        textSpan.textContent = `Start: ${session.start_time}, End: ${session.end_time}, Place: ${session.place}`;
        li.appendChild(textSpan);

        if (user && session.creator_id === user.id) {
          const cancelBtn = document.createElement('button');
          cancelBtn.textContent = 'Cancel';
          cancelBtn.addEventListener('click', async () => {
            try {
              const delRes = await fetch(`/api/sessions/${session.id}`, {
                method: 'DELETE'
              });
              if (delRes.status === 401) {
                window.location.href = '/login';
                return;
              }
              if (!delRes.ok) {
                const errText = await errorText(delRes, 'Failed to cancel session');
                throw new Error(errText || 'Failed to cancel session');
              }
              loadSessions();
            } catch (err) {
              errorEl.textContent = err.message || 'Failed to cancel session';
              errorEl.style.display = 'block';
            }
          });
          li.appendChild(cancelBtn);
        }

        listEl.appendChild(li);
      });
    }

    addSessionForm.onsubmit = async (e) => {
      e.preventDefault();
      formErrorEl.style.display = 'none';
      formErrorEl.textContent = '';

      const startTime = document.getElementById('start').value;
      const endTime = document.getElementById('end').value;
      const place = document.getElementById('place').value;

      try {
        const postRes = await fetch(`/api/groups/${groupId}/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ startTime, endTime, place })
        });

        if (postRes.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (postRes.status === 409 || postRes.status === 422) {
          const errText = await errorText(postRes, 'The session was refused');
          formErrorEl.textContent = errText;
          formErrorEl.style.display = 'block';
          return;
        }

        if (!postRes.ok) {
          const errText = await errorText(postRes, 'Failed to create session');
          throw new Error(errText || 'Failed to create session');
        }

        addSessionForm.reset();
        loadSessions();
      } catch (err) {
        formErrorEl.textContent = err.message || 'Failed to create session';
        formErrorEl.style.display = 'block';
      }
    };

  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.textContent = err.message || 'Failed to load sessions. Please try again later.';
    errorEl.style.display = 'block';
  }
}

loadSessions();
