document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('edit-song-form');
  const status = document.getElementById('edit-status');
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  const artistSelect = document.getElementById('artistSelect');
  const artistIdInput = document.getElementById('artistId');
  const artistNameInput = document.getElementById('artistName');

  function setStatus(msg, isError = false) {
    if (!status) return;
    status.textContent = msg;
    status.style.color = isError ? 'red' : 'green';
  }

  // Load all artists and populate dropdown
  async function loadArtists() {
    try {
      const res = await fetch('/api/artists');
      if (!res.ok) throw new Error('Failed to load artists');
      
      const artists = await res.json();
      
      // Clear existing options except the first one
      artistSelect.innerHTML = '<option value="">-- Choose an artist --</option>';
      
      if (!artists || artists.length === 0) {
        artistSelect.innerHTML += '<option value="" disabled>No artists available</option>';
        return;
      }
      
      // Populate dropdown with artists
      artists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist._id;
        option.textContent = artist.name || artist.username || 'Unknown Artist';
        option.dataset.artistName = artist.name || artist.username || 'Unknown Artist';
        artistSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Error loading artists:', err);
    }
  }

  // When artist is selected, update hidden fields
  artistSelect.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption.value) {
      artistIdInput.value = selectedOption.value;
      artistNameInput.value = selectedOption.dataset.artistName;
    } else {
      artistIdInput.value = '';
      artistNameInput.value = '';
    }
  });

  // File input preview functionality
  function bindFileInputPreview(inputId, defaultText) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const wrapper = input.closest('.file-input-wrapper');
    const textEl = wrapper ? wrapper.querySelector('.file-input-text') : null;
    input.addEventListener('change', () => {
      if (!textEl) return;
      if (input.files && input.files.length > 0) {
        const f = input.files[0];
        const sizeKB = Math.round(f.size / 1024);
        textEl.textContent = `${f.name} (${sizeKB} KB)`;
      } else {
        textEl.textContent = defaultText;
      }
    });
  }

  bindFileInputPreview('audio', 'Choose audio file...');
  bindFileInputPreview('cover', 'Choose cover image...');

  if (!id) {
    setStatus('No song id provided', true);
    return;
  }

  async function loadSong() {
    try {
      const res = await fetch(`/api/songs/${id}`);
      if (!res.ok) throw new Error('Failed to load song');
      const song = await res.json();
      document.getElementById('title').value = song.title || '';
      artistIdInput.value = song.artistId || '';
      artistNameInput.value = song.artistName || '';
      
      // Select the artist in dropdown if it exists
      if (song.artistId) {
        artistSelect.value = song.artistId;
      }
      
      setStatus('Loaded song for editing');
    } catch (err) {
      setStatus(err.message || 'Load error', true);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
      const token = userInfo?.token;
      if (!token) throw new Error('Not authenticated');

      const fd = new FormData(form);

      const res = await fetch(`/api/admin/songs/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      setStatus('Update successful');
    } catch (err) {
      setStatus(err.message || 'Error', true);
    }
  });

  // Add delete button functionality (adds a Delete button next to Save)
  const formActions = form.querySelector('.form-actions');
  if (formActions) {
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'secondary-btn';
    delBtn.textContent = 'Delete Song';
    delBtn.style.marginLeft = '10px';
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this song? This cannot be undone.')) return;
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
        const token = userInfo?.token;
        if (!token) throw new Error('Not authenticated');
        const res = await fetch(`/api/admin/songs/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Delete failed');
        setStatus('Song deleted');
        // Redirect back to admin songs page
        setTimeout(() => (window.location.href = '/admin_songs'), 700);
      } catch (err) {
        setStatus(err.message || 'Delete error', true);
      }
    });
    formActions.appendChild(delBtn);
  }

  // Load artists first, then load song
  loadArtists().then(() => {
    loadSong();
  });
});
