async function loadGroups() {
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const emptyEl = document.getElementById('empty');
  const listEl = document.getElementById('groups-list');

  loadingEl.style.display = 'block';
  errorEl.style.display = 'none';
  emptyEl.style.display = 'none';
  listEl.innerHTML = '';

  try {
    const res = await fetch('/api/groups');
    if (!res.ok) {
      throw new Error('Failed to fetch groups');
    }
    const groups = await res.json();
    loadingEl.style.display = 'none';

    if (!groups || groups.length === 0) {
      emptyEl.style.display = 'block';
      return;
    }

    groups.forEach((group) => {
      const li = document.createElement('li');
      li.textContent = `${group.name} - ${group.course}`;
      listEl.appendChild(li);
    });
  } catch (err) {
    loadingEl.style.display = 'none';
    errorEl.textContent = 'Failed to load groups. Please try again later.';
    errorEl.style.display = 'block';
  }
}

loadGroups();
