// library.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Library DOMContentLoaded Start");

    const libraryContainer = document.getElementById('library-content-container');
    const playlistUl = document.getElementById('playlist-links-list');

    if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && libraryContainer) {
        libraryContainer.innerHTML = ''; // Clear old content

        const libraryTitle = document.createElement('h1');
        libraryTitle.textContent = 'Full Library'; // Or "All Songs"
        libraryContainer.appendChild(libraryTitle);

        // Create table-style song list container
        const songListContainer = document.createElement('div');
        songListContainer.id = "library-song-list-container";
        songListContainer.classList.add('song-list-container'); // Reuse class from artist_page CSS

        const allSongs = [];
        ALL_MUSIC_SECTIONS.forEach(section => {
            if (Array.isArray(section.songs)) {
                section.songs.forEach(song => {
                    const uniqueId = song.id || `${song.title}-${song.artistData}`;
                    if (!allSongs.some(s => (s.id || `${s.title}-${s.artistData}`) === uniqueId)) {
                        // Add original artist info to song object for display
                        // Assuming song.displayArtist.name is main artist name
                        song.artistNameToDisplay = song.displayArtist?.name || song.artistData || 'N/A';
                        allSongs.push(song);
                    }
                });
            }
        });

        if (allSongs.length > 0) {
            // Option: Sort
            // allSongs.sort((a, b) => (a.title || "").localeCompare(b.title || ""));

            // Create table header (optional, if column titles wanted)
            
            const tableHeader = document.createElement('div');
            tableHeader.classList.add('song-list-header', 'song-list-item'); // Reuse item class
            tableHeader.innerHTML = `
                <span class="song-index">#</span>
                <span class="song-art-placeholder"></span> <div class="song-details">
                    <div class="song-title">TITLE</div>
                </div>
                <div class="song-artist-header">ARTIST</div> <div class="song-plays">PLAYS</div>
                <div class="song-duration">DURATION</div>
                <div class="song-actions-placeholder"></div> `;
            songListContainer.appendChild(tableHeader);
            


            allSongs.forEach((song, index) => {
                // Call function to create a song row (defined in utils.js)
                if (typeof window.createSongListItem === 'function') {
                    const songItemElement = window.createSongListItem(song, index + 1, song.artistNameToDisplay);
                    songListContainer.appendChild(songItemElement);
                } else {
                    console.error("Function createSongListItem does not exist.");
                }
            });
        } else {
            const noSongsMessage = document.createElement('p');
            noSongsMessage.textContent = 'Your library is empty.';
            noSongsMessage.style.textAlign = 'center';
            noSongsMessage.style.padding = '40px 20px';
            songListContainer.appendChild(noSongsMessage);
        }
        libraryContainer.appendChild(songListContainer);

    } else {
        console.error("Error loading library data.");
        if(libraryContainer) libraryContainer.innerHTML = '<h1>Library</h1><p>Error loading library data.</p>';
    }

    // Render playlist links in sidebar
    if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && playlistUl && typeof window.renderPlaylistLinks === 'function') {
        window.renderPlaylistLinks(ALL_MUSIC_SECTIONS, playlistUl);
    }

    // Active library link
    document.querySelectorAll('.sidebar-nav a').forEach(link => link.classList.remove('active'));
    const libraryLink = document.querySelector('.sidebar-nav a[href="library.html"]');
    if(libraryLink) libraryLink.classList.add('active');

    console.log("Library DOMContentLoaded End");
});
// --- Function to create a song item in list (table style) ---
// songData: object containing song info
// index: song order number
// artistNameToDisplay: Artist name to display (can be taken from songData.displayArtist.name)
function createSongListItem(songData, index, artistNameToDisplay) {
    const songItem = document.createElement('div');
    songItem.classList.add('song-list-item');
    // Set data attributes for playing music
    songItem.dataset.src = songData.audioSrc || '';
    songItem.dataset.title = songData.title || 'Untitled';
    // data-artist should be main artist name of that song, can be artistNameToDisplay
    songItem.dataset.artist = artistNameToDisplay || songData.artistData || 'N/A';
    songItem.dataset.art = songData.albumArt || songData.artUrl || 'https://via.placeholder.com/40'; // Prefer albumArt if available

    // Update duration from audio file if not yet available (this logic should be in initial data processing step)
    // If songData.duration is pre-calculated (e.g. from getAudioFileDuration), use it
    const durationDisplay = songData.duration || 'N/A'; // Assuming duration is available

    songItem.innerHTML = `
        <span class="song-index">${index}</span>
        <img src="${songData.albumArt || songData.artUrl || 'https://via.placeholder.com/40'}" alt="${songData.title || 'Art'}" class="album-art-small">
        <div class="song-details">
            <div class="song-title">${songData.title || 'Untitled'}</div>
            <div class="song-artist-name-in-list">${artistNameToDisplay || 'Unknown Artist'}</div>
        </div>
        <div class="song-album-placeholder"></div> <div class="song-plays">${songData.plays || 'N/A'}</div> <div class="song-duration">${durationDisplay}</div>
        <div class="song-actions">
            <button title="Like" class="like-song-btn" data-song-id="${songData.id || ''}">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
            </div>
    `;

    // Attach listener to play music when clicking item (not on like button or artist link)
    songItem.addEventListener('click', function(event) {
        // Only play music if clicking directly on item, not on child buttons
        if (event.target.closest('button.like-song-btn') || event.target.closest('a')) {
            return; // Do nothing if clicking like button or link
        }

        if (typeof window.playSongFromData === 'function' && this.dataset.src) {
            window.playSongFromData({
                src: this.dataset.src,
                title: this.dataset.title,
                artist: this.dataset.artist, // Artist for player bar
                art: this.dataset.art
            });
        } else {
            console.warn("Cannot play song from list.");
        }
    });

    // Handle like button (e.g., you can expand later)
    const likeBtn = songItem.querySelector('.like-song-btn');
    if (likeBtn) {
        // Check initial favorite state (if any)
        if (songData.isFavorite) {
            likeBtn.classList.add('liked'); // Add 'liked' class if already liked
            likeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#1DB954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        }

        likeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent parent item click event
            this.classList.toggle('liked');
            // Update isFavorite state in data (temporary, as it's static web)
            // And update icon
            if (this.classList.contains('liked')) {
                songData.isFavorite = true; // Update in songData object (only effective this session)
                this.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#1DB954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                console.log(`Liked: ${songData.title}`);
            } else {
                songData.isFavorite = false;
                this.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
                console.log(`Unliked: ${songData.title}`);
            }
            // TODO: Update this state to localStorage or server if available
        });
    }

    return songItem;
}
// Expose createSongListItem function to global
window.createSongListItem = createSongListItem;
console.log("library.js loaded");