// public/js/library.js (API call version)

document.addEventListener('DOMContentLoaded', () => {
    const libraryContainer = document.getElementById('library-content-container');
    const songsDisplayContainer = document.getElementById('library-songs-display');

    if (!libraryContainer || !songsDisplayContainer) {
        console.error("Library.js: Necessary containers not found.");
        return;
    }

    let currentViewMode = 'grid';
    let allLibrarySongs = [];

    // --- Function to render content based on view mode ---
    function renderLibraryContent(songs) {
        songsDisplayContainer.innerHTML = ''; // Clear old content (e.g., "Loading...")

        if (!songs || songs.length === 0) {
            songsDisplayContainer.innerHTML = '<p class="search-initial-message">Your library is empty.</p>';
            return;
        }

        if (currentViewMode === 'grid') {
            songsDisplayContainer.className = 'card-grid';
            songs.forEach(song => {
                // Use createSongCard function from utils.js
                if (typeof window.createSongCard !== 'function') return;
                const card = window.createSongCard(song);
                
                // Add click event with play/pause toggle
                card.addEventListener('click', (event) => {
                    if (typeof window.playSongFromData !== 'function') return;
                    
                    const audioPlayer = document.getElementById('audio-player');
                    const isThisSongPlaying = window.currentPlayingIndex !== undefined && 
                                             window.currentPlaylist[window.currentPlayingIndex]?._id === song._id;
                    
                    if (isThisSongPlaying && !audioPlayer.paused) {
                        // If this song is currently playing, pause it
                        audioPlayer.pause();
                    } else if (isThisSongPlaying && audioPlayer.paused) {
                        // If this song is paused, resume it
                        audioPlayer.play();
                    } else {
                        // Play new song
                        window.playSongFromData(song, songs);
                    }
                });
                
                songsDisplayContainer.appendChild(card);
            });
            
            // Update play/pause buttons after rendering
            if (typeof window.updateAllCardPlayButtons === 'function') {
                window.updateAllCardPlayButtons();
            }
        } else if (currentViewMode === 'list') {
            songsDisplayContainer.className = 'song-list-container';

            // Table header
            const tableHeader = document.createElement('div');
            tableHeader.className = 'song-list-header song-list-item';
            tableHeader.innerHTML = `
                <span class="song-index">#</span>
                <div class="song-details"><div class="song-title">TITLE</div></div>
                <div class="song-artist-column">ARTIST</div>
                <div class="song-plays">PLAYS</div>
            `;
            songsDisplayContainer.appendChild(tableHeader);

            // Song rows
            songs.forEach((song, index) => {
                // Use createSongListItem function from utils.js
                if (typeof window.createSongListItem !== 'function') return;
                const songItem = window.createSongListItem(song, index + 1, song.artistName);
                songItem.addEventListener('click', (event) => {
                    if (event.target.closest('.like-song-btn')) return;
                    if (typeof window.playSongFromData !== 'function') return;
                    window.playSongFromData(song, songs);
                });
                songsDisplayContainer.appendChild(songItem);
            });
        }
    }

    // --- Function to initialize header and controls ---
    function initializeControls() {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'library-header';
        headerDiv.innerHTML = `
            <h1>Full Library</h1>
            <div class="view-toggle-buttons">
                <button id="view-toggle-grid" class="view-toggle-btn active" title="Grid View (Card)">
                    <svg viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm0 10h8v8H3v-8zM13 3h8v8h-8V3zm0 10h8v8h-8v-8z"/></svg>
                </button>
                <button id="view-toggle-list" class="view-toggle-btn" title="List View">
                    <svg viewBox="0 0 24 24"><path d="M4 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4zm0 4h16v2H4z"/></svg>
                </button>
            </div>
        `;
        // Prepend header to start of main content
        libraryContainer.prepend(headerDiv);

        // Attach events to view toggle buttons
        const gridBtn = document.getElementById('view-toggle-grid');
        const listBtn = document.getElementById('view-toggle-list');

        gridBtn.addEventListener('click', () => {
            if (currentViewMode !== 'grid') {
                currentViewMode = 'grid';
                gridBtn.classList.add('active');
                listBtn.classList.remove('active');
                renderLibraryContent(allLibrarySongs);
            }
        });

        listBtn.addEventListener('click', () => {
            if (currentViewMode !== 'list') {
                currentViewMode = 'list';
                listBtn.classList.add('active');
                gridBtn.classList.remove('active');
                renderLibraryContent(allLibrarySongs);
            }
        });
    }

    // --- Main function: Load data and initialize page ---
    async function loadLibrary() {
        try {
            const response = await fetch('/api/songs');
            if (!response.ok) {
                throw new Error('Unable to load library data from server.');
            }
            allLibrarySongs = await response.json();

            // Sort songs by title A-Z
            allLibrarySongs.sort((a, b) => a.title.localeCompare(b.title));

            // Data loaded, now render content
            renderLibraryContent(allLibrarySongs);

        } catch (error) {
            console.error("Error loading library:", error);
            songsDisplayContainer.innerHTML = `<p class="error-message">An error occurred while loading the library. Please try again.</p>`;
        }
    }

    // Initialize everything
    initializeControls();
    loadLibrary();

    // --- Function to render content based on view mode ---
    // (Redundant definition removed, keeping the first one is enough, but if you want to override it here due to your structure, fine, but it's better to have one definition. I will keep the updated one below as it seems to have more details in list view)
    // Actually, looking closely, the first renderLibraryContent uses window.createSongListItem which is good if you have it.
    // The second one manually creates elements. Let's use the manual one if that's what you intended with "START UPDATE".
    // Wait, the first one uses window.createSongListItem, which is cleaner if it exists.
    // I will merge them to use the manual creation as requested in the "START UPDATE" block of the second definition in your prompt.

    function renderLibraryContentUpdated(songs) {
        songsDisplayContainer.innerHTML = '';

        if (!songs || songs.length === 0) {
            songsDisplayContainer.innerHTML = '<p class="search-initial-message">Your library is empty.</p>';
            return;
        }

        if (currentViewMode === 'grid') {
            songsDisplayContainer.className = 'card-grid';
            songs.forEach(song => {
                if (typeof window.createSongCard !== 'function') return;
                const card = window.createSongCard(song);
                card.addEventListener('click', () => {
                    if (typeof window.playSongFromData !== 'function') return;
                    window.playSongFromData(song, songs);
                });
                songsDisplayContainer.appendChild(card);
            });
        } else if (currentViewMode === 'list') {
            // --- START UPDATE ---
            songsDisplayContainer.className = 'song-list-container';

            // Table header
            const tableHeader = document.createElement('div');
            tableHeader.className = 'song-list-header song-list-item';
            // Columns: #, Art, Title, Artist, Plays
            tableHeader.innerHTML = `
            <span class="song-index">#</span>
            <div class="song-art-placeholder"></div>
            <div class="song-details">TITLE</div>
            <div class="song-artist-column">ARTIST</div>
            <div class="song-plays">PLAYS</div>
        `;
            songsDisplayContainer.appendChild(tableHeader);

            // Song rows
            songs.forEach((song, index) => {
                const songItem = document.createElement('div');
                songItem.className = 'song-list-item';
                songItem.dataset.songId = song._id; // Add song ID for tracking

                // Add data-artist to song-details for responsive use
                const artistName = song.artistName || 'Unknown Artist';

                songItem.innerHTML = `
                <span class="song-index">
                    <span class="index-number">${index + 1}</span>
                    <button class="play-pause-icon" style="display: none;">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M8 5v14l11-7z"></path>
                        </svg>
                    </button>
                </span>
                <img src="/${song.artUrl || 'img/song-holder.png'}" alt="${song.title}" class="album-art-small">
                <div class="song-details" data-artist="${artistName}">
                    <div class="song-title">${song.title}</div>
                </div>
                <div class="song-artist-column">${artistName}</div>
                <div class="song-plays">${(song.plays || 0).toLocaleString('en-US')}</div>
            `;

                // Add hover effect to show play button
                songItem.addEventListener('mouseenter', () => {
                    const audioPlayer = document.getElementById('audio-player');
                    const isThisSongPlaying = window.currentPlayingIndex !== undefined && 
                                             window.currentPlaylist[window.currentPlayingIndex]?._id === song._id;
                    
                    if (!isThisSongPlaying || audioPlayer.paused) {
                        songItem.querySelector('.index-number').style.display = 'none';
                        songItem.querySelector('.play-pause-icon').style.display = 'inline-block';
                    }
                });

                songItem.addEventListener('mouseleave', () => {
                    const audioPlayer = document.getElementById('audio-player');
                    const isThisSongPlaying = window.currentPlayingIndex !== undefined && 
                                             window.currentPlaylist[window.currentPlayingIndex]?._id === song._id;
                    
                    if (!isThisSongPlaying || audioPlayer.paused) {
                        songItem.querySelector('.index-number').style.display = 'inline';
                        songItem.querySelector('.play-pause-icon').style.display = 'none';
                    }
                });

                songItem.addEventListener('click', (event) => {
                    if (typeof window.playSongFromData !== 'function') return;
                    
                    const audioPlayer = document.getElementById('audio-player');
                    const isThisSongPlaying = window.currentPlayingIndex !== undefined && 
                                             window.currentPlaylist[window.currentPlayingIndex]?._id === song._id;
                    
                    if (isThisSongPlaying && !audioPlayer.paused) {
                        // If this song is currently playing, pause it
                        audioPlayer.pause();
                    } else if (isThisSongPlaying && audioPlayer.paused) {
                        // If this song is paused, resume it
                        audioPlayer.play();
                    } else {
                        // Play new song
                        window.playSongFromData(song, songs);
                    }
                });
                
                songsDisplayContainer.appendChild(songItem);
            });
            // --- END UPDATE ---
        }
    }

    // Override the initial render function with the updated one
    renderLibraryContent = renderLibraryContentUpdated;

    // --- Function to update play/pause icons based on player state ---
    function updatePlayPauseIcons() {
        const audioPlayer = document.getElementById('audio-player');
        const allSongItems = document.querySelectorAll('.song-list-item');
        
        allSongItems.forEach((item) => {
            const songId = item.dataset.songId;
            const indexNumber = item.querySelector('.index-number');
            const playPauseIcon = item.querySelector('.play-pause-icon');
            
            if (!indexNumber || !playPauseIcon) return;
            
            const isThisSongPlaying = window.currentPlayingIndex !== undefined && 
                                     window.currentPlaylist[window.currentPlayingIndex]?._id === songId;
            
            if (isThisSongPlaying && !audioPlayer.paused) {
                // This song is currently playing - show pause icon
                indexNumber.style.display = 'none';
                playPauseIcon.style.display = 'inline-block';
                playPauseIcon.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"></path>
                    </svg>
                `;
            } else if (isThisSongPlaying && audioPlayer.paused) {
                // This song is paused - show play icon
                indexNumber.style.display = 'none';
                playPauseIcon.style.display = 'inline-block';
                playPauseIcon.innerHTML = `
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M8 5v14l11-7z"></path>
                    </svg>
                `;
            } else {
                // Other songs - show index number
                indexNumber.style.display = 'inline';
                playPauseIcon.style.display = 'none';
            }
        });
    }

    // Listen to audio player events to update icons
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.addEventListener('play', () => {
            updatePlayPauseIcons();
            if (typeof window.updateAllCardPlayButtons === 'function') {
                window.updateAllCardPlayButtons();
            }
        });
        audioPlayer.addEventListener('pause', () => {
            updatePlayPauseIcons();
            if (typeof window.updateAllCardPlayButtons === 'function') {
                window.updateAllCardPlayButtons();
            }
        });
        audioPlayer.addEventListener('ended', () => {
            updatePlayPauseIcons();
            if (typeof window.updateAllCardPlayButtons === 'function') {
                window.updateAllCardPlayButtons();
            }
        });
    }

    // Also update when a new song is loaded
    document.addEventListener('songChanged', () => {
        updatePlayPauseIcons();
        if (typeof window.updateAllCardPlayButtons === 'function') {
            window.updateAllCardPlayButtons();
        }
    });

    // --- ADD THIS FUNCTION AGAIN (redundant if already defined above, but keeping structure) ---
    // --- Function to initialize header and controls ---
    // (Already defined above, no need to redefine if it's exactly the same. I'll skip redefining it to avoid errors, or just keep the first one.)
    // Actually, the prompt has it redefined at the end. I will trust the first definition is enough if it's identical.
    // Checking... yes, it's identical in structure. I will use the first one.

});