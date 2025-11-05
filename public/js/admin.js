document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("song-upload-form");
  const statusBox = document.getElementById("upload-status");
  const artistSelect = document.getElementById("artistSelect");
  const artistIdInput = document.getElementById("artistId");
  const artistNameInput = document.getElementById("artistName");

  function setStatus(message, isError = false) {
    statusBox.textContent = message;
    statusBox.style.color = isError ? "red" : "green";
  }

  // Load all artists and populate dropdown
  async function loadArtists() {
    const debugApiStatus = document.getElementById('debug-api-status');
    const debugArtistsData = document.getElementById('debug-artists-data');
    
    try {
      console.log('[admin.js] Loading artists from /api/artists...');
      if (debugApiStatus) debugApiStatus.textContent = 'Fetching from /api/artists...';
      
      const res = await fetch('/api/artists');
      console.log('[admin.js] Response status:', res.status, res.statusText);
      if (debugApiStatus) debugApiStatus.textContent = `API Response: ${res.status} ${res.statusText}`;
      
      if (!res.ok) throw new Error('Failed to load artists');
      
      const artists = await res.json();
      console.log('[admin.js] Received artists:', artists);
      console.log('[admin.js] Number of artists:', artists ? artists.length : 0);
      
      if (debugArtistsData) {
        debugArtistsData.innerHTML = `
          <div>Total artists received: ${artists ? artists.length : 0}</div>
          <div>Artists data: ${JSON.stringify(artists, null, 2).substring(0, 500)}</div>
        `;
      }
      
      // Clear existing options except the first one
      artistSelect.innerHTML = '<option value="">-- Choose an artist --</option>';
      
      if (!artists || artists.length === 0) {
        console.log('[admin.js] No artists found!');
        artistSelect.innerHTML += '<option value="" disabled>No artists available - Create one first</option>';
        setStatus('No artists found. Please create an artist first.', true);
        return;
      }
      
      // Populate dropdown with artists
      artists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist._id;
        option.textContent = artist.name || artist.username || 'Unknown Artist';
        option.dataset.artistName = artist.name || artist.username || 'Unknown Artist';
        artistSelect.appendChild(option);
        console.log('[admin.js] Added artist to dropdown:', option.textContent, 'ID:', option.value);
      });
      
      setStatus(`Loaded ${artists.length} artist${artists.length !== 1 ? 's' : ''}. Select one to upload a song.`);
    } catch (err) {
      console.error('[admin.js] Error loading artists:', err);
      if (debugApiStatus) debugApiStatus.innerHTML = `<span style="color: #e03131;">Error: ${err.message}</span>`;
      if (debugArtistsData) debugArtistsData.innerHTML = `<span style="color: #e03131;">Error details: ${err.stack || err}</span>`;
      setStatus('Error loading artists: ' + err.message, true);
    }
  }

  // When artist is selected, update hidden fields
  artistSelect.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (selectedOption.value) {
      artistIdInput.value = selectedOption.value;
      artistNameInput.value = selectedOption.dataset.artistName;
      setStatus(`Selected artist: ${selectedOption.dataset.artistName}`);
    } else {
      artistIdInput.value = '';
      artistNameInput.value = '';
      setStatus('Please select an artist', true);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("Uploading...");

    try {
      const formData = new FormData(form);

      // 🧩 Load token from stored user info
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;
      if (!token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const res = await fetch('/api/admin/songs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }

      // Check if cover was extracted from audio
      if (data.coverExtracted) {
        setStatus('Upload successful! ✨ Cover art was automatically extracted from the audio file. Redirecting...');
      } else if (data.song && data.song.artUrl) {
        setStatus('Upload successful! Using your uploaded cover image. Redirecting...');
      } else {
        setStatus('Upload successful! No cover art available. Redirecting...');
      }
      
      form.reset();
      // Redirect to manage songs page after 2 seconds
      setTimeout(() => {
        window.location.href = '/admin_songs';
      }, 2000);
    } catch (err) {
      setStatus(err.message || "Upload error", true);
    }
  });

  // --- SHOW SELECTED FILE NAME ---
  function bindFileInputPreview(inputId, defaultText) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const wrapper = input.closest('.file-input-wrapper');
    const textEl = wrapper ? wrapper.querySelector('.file-input-text') : null;
    input.addEventListener('change', () => {
      if (!textEl) return;
      if (input.files && input.files.length > 0) {
        const f = input.files[0];
        // show name and size in KB
        const sizeKB = Math.round(f.size / 1024);
        textEl.textContent = `${f.name} (${sizeKB} KB)`;
      } else {
        textEl.textContent = defaultText;
      }
    });
  }

  bindFileInputPreview('audio', 'Choose audio file...');
  bindFileInputPreview('cover', 'Choose cover image...');

  // Load artists on page load
  loadArtists();
});
