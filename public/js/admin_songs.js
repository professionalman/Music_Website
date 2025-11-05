document.addEventListener('DOMContentLoaded', () => {
  const songsListEl = document.getElementById('songs-list');
  let allSongs = []; // Store all songs for filtering

  async function loadSongs() {
    try {
      const res = await fetch('/api/songs');
      const payload = await res.json();
      // payload might be an array or an object depending on server; normalize to array
      allSongs = Array.isArray(payload) ? payload : (payload.songs || payload);
      renderSongs(allSongs);
    } catch (err) {
      console.error('[admin_songs.js] loadSongs error', err);
      if (songsListEl) {
        songsListEl.innerHTML = `<p style="color: #e03131;">Error loading songs: ${err.message || err}</p>`;
      }
    }
  }

  function renderSongs(songs) {
    if (!songsListEl) return;
    
    if (!songs || songs.length === 0) {
      songsListEl.innerHTML = '<p style="color: #b3b3b3; text-align: center; padding: 40px;">No songs found.</p>';
      return;
    }
    
    const rows = songs.map(s => {
      const imageUrl = s.artUrl ? `/${s.artUrl}` : '/img/song-holder.png';
      return `
        <div class="song-row" data-id="${s._id}" style="background: #181818; padding: 15px; margin-bottom: 10px; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;">
          <div class="song-info-content" style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <img src="${imageUrl}" alt="${escapeHtml(s.title)}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;" onerror="this.src='/img/song-holder.png'">
            <div>
              <strong style="color: #fff; font-size: 1em;">${escapeHtml(s.title)}</strong>
              <p style="color: #b3b3b3; margin: 4px 0 0 0; font-size: 0.9em;">${escapeHtml(s.artistName)}</p>
            </div>
          </div>
          <div class="song-actions" style="display: flex; gap: 8px;">
            <button class="icon-btn btn-edit" title="Edit" data-id="${s._id}" style="background: #282828; border: none; padding: 8px; border-radius: 50%; cursor: pointer; color: #1DB954; transition: background 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.0001 1.0001 0 0 0 0-1.41l-2.34-2.34a1.0001 1.0001 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>
            </button>
            <button class="icon-btn btn-delete" title="Delete" data-id="${s._id}" style="background: #282828; border: none; padding: 8px; border-radius: 50%; cursor: pointer; color: #e03131; transition: background 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
    songsListEl.innerHTML = rows;

    // Attach events
    songsListEl.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', onEditClick);
      // Add hover effect
      btn.addEventListener('mouseenter', (e) => e.currentTarget.style.background = '#3a3a3a');
      btn.addEventListener('mouseleave', (e) => e.currentTarget.style.background = '#282828');
    });
    
    songsListEl.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', onDeleteClick);
      // Add hover effect
      btn.addEventListener('mouseenter', (e) => e.currentTarget.style.background = '#3a3a3a');
      btn.addEventListener('mouseleave', (e) => e.currentTarget.style.background = '#282828');
    });

    // Add hover effect to song rows
    songsListEl.querySelectorAll('.song-row').forEach(row => {
      row.addEventListener('mouseenter', (e) => e.currentTarget.style.background = '#282828');
      row.addEventListener('mouseleave', (e) => e.currentTarget.style.background = '#181818');
    });
  }

  // Search functionality
  function filterSongs(searchQuery) {
    if (!searchQuery || searchQuery.trim() === '') {
      renderSongs(allSongs);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allSongs.filter(song => {
      const title = (song.title || '').toLowerCase();
      const artistName = (song.artistName || '').toLowerCase();
      return title.includes(query) || artistName.includes(query);
    });

    renderSongs(filtered);
  }

  // Attach search input listener
  const searchInput = document.getElementById('song-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filterSongs(e.target.value);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) { 
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; 
    });
  }

  function onEditClick(e) {
    const id = e.currentTarget.dataset.id;
    // Redirect to the edit page
    window.location.href = `/admin_song?id=${encodeURIComponent(id)}`;
  }

  async function onDeleteClick(e) {
    const id = e.currentTarget.dataset.id;
    if (!confirm('Delete this song? This action cannot be undone.')) return;
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token;
      if (!token) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const res = await fetch(`/api/admin/songs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      
      // Show success notification
      showNotification('Song deleted successfully', 'success');
      
      // Reload the songs list
      await loadSongs();
    } catch (err) {
      console.error('[admin_songs.js] Delete error:', err);
      showNotification(err.message || 'Delete error', 'error');
    }
  }

  function showNotification(message, type = 'info') {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${type === 'success' ? '#1DB954' : type === 'error' ? '#e03131' : '#282828'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-size: 0.95em;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Load songs on page load
  loadSongs();
});
