// utils.js
console.log("utils.js loading...");

// --- Time Formatting Function (MM:SS) ---
function formatTime(seconds) {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// --- Function to get duration of an audio file (returns Promise) ---
function getAudioFileDuration(audioSrc) {
    return new Promise((resolve) => {
        if (!audioSrc) {
            // console.warn("getAudioFileDuration: audioSrc not provided.");
            resolve("0:00"); // Return default value if no src
            return;
        }
        const audio = new Audio();
        audio.preload = "metadata"; // Only load metadata

        audio.onloadedmetadata = () => {
            if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
                // console.log(`Duration for ${audioSrc}: ${audio.duration}`);
                resolve(formatTime(audio.duration)); // Use local formatTime
            } else {
                // console.warn(`getAudioFileDuration: Invalid duration for ${audioSrc}. Value: ${audio.duration}`);
                resolve("N/A");
            }
            // Free up resources after getting metadata
            audio.src = ""; // Clear src to stop further loading
            audio.load();   // Request browser to cancel loading
        };
        audio.onerror = (e) => {
            // console.warn(`getAudioFileDuration: Error loading metadata for ${audioSrc}:`, e);
            resolve("N/A");
        };
        try {
            audio.src = audioSrc;
        } catch (error) {
            console.error(`getAudioFileDuration: Error assigning src to audio ${audioSrc}:`, error);
            resolve("N/A");
        }
    });
}

// --- Function to create a song card (for grid/card view) ---
function createSongCard(songData) {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.src = songData.audioSrc || '';
    card.dataset.title = songData.title || 'Untitled';
    card.dataset.artist = songData.artistData || songData.displayArtist?.name || 'N/A';
    card.dataset.art = songData.artUrl || 'https://via.placeholder.com/200';

    const img = document.createElement('img');
    img.src = songData.artUrl || 'https://via.placeholder.com/200';
    img.alt = songData.title || 'Album Art';
    img.classList.add('album-art');
    img.loading = 'lazy';

    const titleH3 = document.createElement('h3');
    titleH3.classList.add('song-title');
    titleH3.textContent = songData.title || 'Untitled';

    const artistP = document.createElement('p');
    artistP.classList.add('song-artist');
    if (songData.displayArtist && songData.displayArtist.id && songData.displayArtist.name) {
        const artistLink = document.createElement('a');
        artistLink.href = `artist_page?artistId=${encodeURIComponent(songData.displayArtist.id)}`;
        artistLink.textContent = songData.displayArtist.name;
        artistLink.addEventListener('click', (e) => e.stopPropagation());
        artistP.appendChild(artistLink);
    } else if (songData.displayArtist && songData.displayArtist.name) {
        artistP.textContent = songData.displayArtist.name;
    } else {
        artistP.textContent = 'Unknown Artist';
    }

    const playButton = document.createElement('button');
    playButton.classList.add('play-button-overlay');
    playButton.innerHTML = '▶';

    card.appendChild(img);
    card.appendChild(titleH3);
    card.appendChild(artistP);
    card.appendChild(playButton);

    return card; // Click listener will be attached by calling function
}

// --- Function to create a song item in list (table style) ---
function createSongListItem(songData, index, artistNameToDisplay) {
    const songItem = document.createElement('div');
    songItem.classList.add('song-list-item');
    songItem.dataset.src = songData.audioSrc || '';
    songItem.dataset.title = songData.title || 'Untitled';
    songItem.dataset.artist = artistNameToDisplay || songData.artistData || 'N/A';
    songItem.dataset.art = songData.albumArt || songData.artUrl || 'https://via.placeholder.com/40';

    const durationDisplay = songData.duration || 'N/A'; // Duration calculated and passed in

    songItem.innerHTML = `
        <span class="song-index">${index}</span>
        <img src="${songData.albumArt || songData.artUrl || 'https://via.placeholder.com/40'}" alt="${songData.title || 'Art'}" class="album-art-small">
        <div class="song-details">
            <div class="song-title">${songData.title || 'Untitled'}</div>
            
        </div>
        <div class="song-artist-column">${artistNameToDisplay || 'Unknown Artist'}</div>
        <div class="song-plays">${songData.plays || 'N/A'}</div>
        <div class="song-duration">${durationDisplay}</div>
        <div class="song-actions">
            <button title="Like" class="like-song-btn" data-song-id="${songData.id || ''}">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </button>
        </div>
    `;

    // Click listener for entire item will be attached by calling function createSongListItem,
    // because it needs context of `playlistArray` (e.g., `songsToDisplay`).

    // Handle like button
    const likeBtn = songItem.querySelector('.like-song-btn');
    if (likeBtn) {
        if (songData.isFavorite) {
            likeBtn.classList.add('liked');
            likeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="#1DB954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        }
        likeBtn.addEventListener('click', function (e) {
            e.stopPropagation(); // Prevent parent item click event
            this.classList.toggle('liked');
            songData.isFavorite = this.classList.contains('liked'); // Update in session
            this.innerHTML = songData.isFavorite ?
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="#1DB954"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' :
                '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
        });
    }
    return songItem;
}

// --- Function to render playlist links in sidebar ---
function renderPlaylistLinks(sectionsData, targetUlElement) {
    if (!targetUlElement) return;
    if (!sectionsData || !Array.isArray(sectionsData)) {
        targetUlElement.innerHTML = '<li>Error loading playlists</li>'; return;
    }
    targetUlElement.innerHTML = '';
    const currentPage = window.location.pathname.split("/").pop();
    const urlParams = new URLSearchParams(window.location.search);
    const currentPlaylistId = urlParams.get('id');

    sectionsData.forEach(section => {
        if (section && section.id && section.title) {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `playlist?id=${encodeURIComponent(section.id)}`;
            link.textContent = section.title;
            if (currentPage === 'playlist' && currentPlaylistId === section.id) {
                link.classList.add('active-playlist-link');
            }
            listItem.appendChild(link);
            targetUlElement.appendChild(listItem);
        }
    });
}

// Expose functions to global so other files can use them
window.formatTime = formatTime;
window.getAudioFileDuration = getAudioFileDuration;
window.createSongCard = createSongCard;
window.createSongListItem = createSongListItem;
window.renderPlaylistLinks = renderPlaylistLinks;

console.log("utils.js loaded successfully.");

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Playlist DOMContentLoaded Start");

    const playlistDetailContainer = document.getElementById('playlist-detail-container');
    const playlistUlSidebar = document.getElementById('playlist-links-list');

    function getPlaylistIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }
    const playlistId = getPlaylistIdFromUrl();

    if (typeof ALL_MUSIC_SECTIONS === 'undefined' || !playlistDetailContainer || !playlistId) {
        console.error("Playlist.js: Music data, container or playlist ID invalid.");
        if (playlistDetailContainer) playlistDetailContainer.innerHTML = '<h1>Error</h1><p>Cannot load playlist info.</p>';
        if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && playlistUlSidebar && typeof window.renderPlaylistLinks === 'function') {
            window.renderPlaylistLinks(ALL_MUSIC_SECTIONS, playlistUlSidebar);
        }
        return;
    }

    const targetSection = ALL_MUSIC_SECTIONS.find(section => section.id === playlistId);

    if (targetSection) {
        playlistDetailContainer.innerHTML = ''; // Clear "Loading..."
        document.title = `${targetSection.title} - My Music Player`;

        // Create Playlist Header
        const playlistHeaderDiv = document.createElement('div');
        playlistHeaderDiv.classList.add('playlist-header-details');
        const playlistCoverArtDiv = document.createElement('div');
        playlistCoverArtDiv.classList.add('playlist-cover-art');
        const coverImg = document.createElement('img');
        coverImg.src = targetSection.songs && targetSection.songs.length > 0 ?
            (targetSection.songs[0].artUrl || 'https://via.placeholder.com/180?text=Playlist') :
            'https://via.placeholder.com/180?text=Playlist';
        coverImg.alt = targetSection.title;
        playlistCoverArtDiv.appendChild(coverImg);
        playlistHeaderDiv.appendChild(playlistCoverArtDiv);
        const playlistInfoDiv = document.createElement('div');
        playlistInfoDiv.classList.add('playlist-info');
        playlistInfoDiv.innerHTML = `
            <span class="playlist-type">Playlist</span>
            <h1 class="playlist-main-title">${targetSection.title}</h1>
            <p class="playlist-description">${targetSection.description || ''}</p>
            <div class="playlist-stats">
                ${targetSection.songs ? targetSection.songs.length : 0} songs
            </div>
        `;
        playlistHeaderDiv.appendChild(playlistInfoDiv);
        playlistDetailContainer.appendChild(playlistHeaderDiv);

        // Create Container for Song List
        const songListContainer = document.createElement('div');
        songListContainer.id = `playlist-${playlistId}-songs`;
        songListContainer.classList.add('song-list-container');

        // Create Table Header
        const tableHeader = document.createElement('div');
        tableHeader.classList.add('song-list-header', 'song-list-item');
        tableHeader.innerHTML = `
            <span class="song-index">#</span>
            <span class="song-art-placeholder"></span>
            <div class="song-details"><div class="song-title">TITLE</div></div>
            <div style="padding-left:40px" class="song-artist-column">ARTIST</div>
            <div class="song-plays">PLAYS</div>
            <div class="song-duration">DURATION</div>
            <div class="song-actions-placeholder"></div>
        `;
        songListContainer.appendChild(tableHeader);

        if (targetSection.songs && targetSection.songs.length > 0) {
            let songsToDisplay = JSON.parse(JSON.stringify(targetSection.songs));

            if (typeof window.getAudioFileDuration === 'function') {
                console.log(`Playlist: Starting to get duration for ${songsToDisplay.length} songs in '${targetSection.title}'...`);
                const durationPromises = songsToDisplay.map(song =>
                    window.getAudioFileDuration(song.audioSrc)
                        .then(duration => {
                            song.duration = duration;
                        })
                        .catch(err => {
                            song.duration = "N/A";
                        })
                );
                try {
                    await Promise.all(durationPromises);
                    console.log("Playlist: Finished getting all durations.");
                } catch (error) {
                    console.error("Playlist: Error in Promise.all while waiting for durations:", error);
                }
            } else {
                console.warn("Playlist: Function window.getAudioFileDuration does not exist.");
                songsToDisplay.forEach(song => song.duration = "N/A");
            }

            songsToDisplay.forEach((songData, index) => {
                if (typeof window.createSongListItem === 'function') {
                    const songItem = window.createSongListItem(
                        songData,
                        index + 1,
                        songData.displayArtist?.name || songData.artistData
                    );
                    // in playlist.js
                    songItem.addEventListener('click', function (event) {
                        if (event.target.closest('button.like-song-btn') || event.target.closest('a')) return;

                        if (typeof window.playSongFromData === 'function' && songData.audioSrc) {
                            // Call function with full `songData` object
                            // and `songsToDisplay` array as playlist context
                            window.playSongFromData(songData, songsToDisplay);
                        } else {
                            console.warn("Playlist: Cannot play song.");
                        }
                    });
                    songListContainer.appendChild(songItem);
                } else {
                    console.error("Playlist: Function window.createSongListItem does not exist.");
                }
            });
        } else {
            songListContainer.innerHTML = '<p>This playlist has no songs yet.</p>';
        }
        playlistDetailContainer.appendChild(songListContainer);

    } else {
        playlistDetailContainer.innerHTML = '<h1>Playlist Not Found</h1><p>The playlist you requested does not exist or has been deleted.</p>';
        document.title = "Playlist Not Found - My Music Player";
    }

    // Render playlist links in sidebar
    if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && playlistUlSidebar && typeof window.renderPlaylistLinks === 'function') {
        window.renderPlaylistLinks(ALL_MUSIC_SECTIONS, playlistUlSidebar);
    }

    // Remove active from main nav, current playlist active link already handled in renderPlaylistLinks
    document.querySelectorAll('.sidebar-nav > ul > li > a').forEach(link => {
        if (!link.closest('.sidebar-playlists')) { // Do not affect links in sidebar-playlists
            link.classList.remove('active');
        }
    });

    // CALL FUNCTION TO INSERT FOOTER AFTER EVERYTHING IS DONE
    if (typeof window.appendMainFooter === 'function') {
        window.appendMainFooter();
    }

    console.log("Playlist DOMContentLoaded End");
});

console.log("playlist.js loaded successfully.");