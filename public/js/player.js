// public/js/player.js (Full and Fixed Version)

console.log("player.js loaded");

// --- GLOBAL VARIABLES AND STATE ---
let currentQueue = [];
let currentIndex = -1;
let isShuffle = false;
let repeatMode = 'none'; // 'none', 'all', 'one'
let lastVolume = 0.7;
let userLikedSongIds = new Set(); // Use Set for faster lookup

// Expose these to window for access from other scripts
window.currentPlaylist = currentQueue;
window.currentPlayingIndex = currentIndex;

// --- UTILITY FUNCTIONS ---

// Get unique storage key for current user
function getPlayerStateKey() {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            return `playerState_${user._id}`;
        } catch (e) {
            console.error('Error parsing userInfo:', e);
        }
    }
    return 'playerState_guest'; // Fallback for non-logged in users
}

// Save player state to localStorage (per user)
function savePlayerState() {
    const audioPlayer = document.getElementById('audio-player');
    if (!audioPlayer) return;

    const playerState = {
        currentQueue: currentQueue,
        currentIndex: currentIndex,
        currentTime: audioPlayer.currentTime,
        isPlaying: !audioPlayer.paused,
        isShuffle: isShuffle,
        repeatMode: repeatMode,
        volume: audioPlayer.volume
    };
    localStorage.setItem(getPlayerStateKey(), JSON.stringify(playerState));
}

// Clear player state (called on logout)
function clearPlayerState() {
    const storageKey = getPlayerStateKey();
    localStorage.removeItem(storageKey);
    
    // Also stop and clear the audio player
    const audioPlayer = document.getElementById('audio-player');
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = '';
        audioPlayer.currentTime = 0;
    }
    
    // Reset queue
    currentQueue = [];
    currentIndex = -1;
    window.currentPlaylist = [];
    window.currentPlayingIndex = -1;
}

// Expose clearPlayerState to window for logout handler
window.clearPlayerState = clearPlayerState;

// Restore player state from localStorage (per user)
function restorePlayerState() {
    const savedState = localStorage.getItem(getPlayerStateKey());
    if (!savedState) return false;

    try {
        const playerState = JSON.parse(savedState);
        if (!playerState.currentQueue || playerState.currentQueue.length === 0) return false;

        currentQueue = playerState.currentQueue;
        currentIndex = playerState.currentIndex;
        isShuffle = playerState.isShuffle || false;
        repeatMode = playerState.repeatMode || 'none';

        // Update window references
        window.currentPlaylist = currentQueue;
        window.currentPlayingIndex = currentIndex;

        const audioPlayer = document.getElementById('audio-player');
        if (audioPlayer && currentIndex >= 0 && currentIndex < currentQueue.length) {
            const songData = currentQueue[currentIndex];
            const savedTime = playerState.currentTime || 0;
            const wasPlaying = playerState.isPlaying || false;
            
            // Set up audio player with aggressive preload for seamless playback
            audioPlayer.preload = 'auto';
            audioPlayer.volume = playerState.volume || 0.7;
            
            // Check if same song is already loaded (avoid reloading)
            if (audioPlayer.src !== songData.audioSrc) {
                audioPlayer.src = songData.audioSrc;
            }

            // Use canplaythrough for smoother playback (ensures enough data buffered)
            // Combined with aggressive seeking approach
            const setTimeAndPlay = () => {
                // Set time immediately if metadata is loaded
                if (audioPlayer.readyState >= 1 && savedTime > 0) {
                    audioPlayer.currentTime = savedTime;
                }
                
                // Auto-play immediately if it was playing before
                if (wasPlaying) {
                    audioPlayer.play().then(() => {
                        // If time wasn't set before, set it after play starts
                        if (savedTime > 0 && Math.abs(audioPlayer.currentTime - savedTime) > 1) {
                            audioPlayer.currentTime = savedTime;
                        }
                    }).catch(err => {
                        console.log("Auto-play blocked by browser:", err);
                    });
                }
            };

            // Try to restore immediately if data is already available
            if (audioPlayer.readyState >= 2) {
                setTimeAndPlay();
            } else {
                // Wait for canplay event (fires when enough data is available)
                audioPlayer.addEventListener('canplay', function resumePlayback() {
                    audioPlayer.removeEventListener('canplay', resumePlayback);
                    setTimeAndPlay();
                }, { once: true });
            }

            // Fallback: Start loading immediately
            audioPlayer.load();

            // Update UI immediately for instant feedback
            document.getElementById('now-playing-title').textContent = songData.title;
            document.getElementById('now-playing-artist').textContent = songData.artistData || songData.artistName;
            document.getElementById('now-playing-art').src = songData.artUrl;
            document.getElementById('np-fullscreen-title').textContent = songData.title;
            document.getElementById('np-fullscreen-artist').textContent = songData.artistData || songData.artistName;
            document.getElementById('np-fullscreen-art').src = songData.artUrl;
            document.title = `${songData.title} - ${songData.artistData || songData.artistName}`;
            updateFavicon(songData.artUrl || "/img/favicon.png");

            // Update like button state
            const likeBtn = document.getElementById('like-btn');
            if (likeBtn) {
                const isLiked = userLikedSongIds.has(songData._id);
                likeBtn.classList.toggle('active', isLiked);
                const svgIcon = likeBtn.querySelector('svg');
                if (svgIcon) {
                    svgIcon.setAttribute('fill', isLiked ? '#1DB954' : 'currentColor');
                }
            }

            // Update shuffle and repeat button states
            const shuffleBtn = document.getElementById('shuffle-btn');
            const repeatBtn = document.getElementById('repeat-btn');
            if (shuffleBtn) shuffleBtn.classList.toggle('active', isShuffle);
            if (repeatBtn) {
                repeatBtn.classList.remove('active', 'repeat-one');
                if (repeatMode === 'all') repeatBtn.classList.add('active');
                if (repeatMode === 'one') repeatBtn.classList.add('repeat-one');
            }

            return true;
        }
    } catch (error) {
        console.error("Error restoring player state:", error);
        localStorage.removeItem('playerState');
    }
    return false;
}

// Display short notification
window.showNotification = function(message, type = 'success') { // Add type parameter and window.
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) return;

    // Clear old classes
    notificationContainer.classList.remove('success', 'error');
    // Add new class based on type
    notificationContainer.classList.add(type);

    clearTimeout(notificationContainer.timeoutId);
    notificationContainer.textContent = message;
    notificationContainer.classList.add('active');

    notificationContainer.timeoutId = setTimeout(() => {
        notificationContainer.classList.remove('active');
    }, 3000); // Increase display time slightly
}

// Format time from seconds to MM:SS
window.formatTime = function(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

// Update browser favicon
function updateFavicon(iconUrl) {
    const oldLink = document.querySelector("link[rel*='icon']");
    if (oldLink) {
        oldLink.href = iconUrl;
    } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = iconUrl;
        document.head.appendChild(newLink);
    }
}


// --- MAIN PLAYER HANDLER FUNCTIONS ---

// Play a song based on its index in the currentQueue
function playSongByIndex(index) {
    if (index < 0 || index >= currentQueue.length) {
        console.warn("Invalid song index, stopped playing.");
        return;
    }

    currentIndex = index;
    const songData = currentQueue[currentIndex];

    // Update window references for other scripts
    window.currentPlaylist = currentQueue;
    window.currentPlayingIndex = currentIndex;

    // --- START CHANGE ---
    const likeBtn = document.getElementById('like-btn');
    if (likeBtn) {
        // Check if current song ID is in 'liked' memory
        const isLiked = userLikedSongIds.has(songData._id);
        likeBtn.classList.toggle('active', isLiked);
        // Update fill for SVG
        const svgIcon = likeBtn.querySelector('svg');
        if (svgIcon) {
            svgIcon.setAttribute('fill', isLiked ? '#1DB954' : 'currentColor');
        }
    }

    // Update Media Session API metadata (for lockscreen, notification bar)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: songData.title,
            artist: songData.artistData || songData.artistName,
            album: 'MyMusic Player',
            artwork: [{ src: songData.artUrl, sizes: '512x512', type: 'image/png' }]
        });
    }

    // Update UI
    document.title = `${songData.title} - ${songData.artistData || songData.artistName}`;
    updateFavicon(songData.artUrl || "/img/favicon.png");

    // Get elements again to be sure
    const audioPlayer = document.getElementById('audio-player');
    document.getElementById('now-playing-title').textContent = songData.title;
    document.getElementById('now-playing-artist').textContent = songData.artistData || songData.artistName;
    document.getElementById('now-playing-art').src = songData.artUrl;
    document.getElementById('np-fullscreen-title').textContent = songData.title;
    document.getElementById('np-fullscreen-artist').textContent = songData.artistData || songData.artistName;
    document.getElementById('np-fullscreen-art').src = songData.artUrl;
    
    // Preload current song aggressively
    audioPlayer.preload = 'auto';
    
    // Construct proper audio path
    let audioSrc = songData.audioSrc;
    if (!audioSrc.startsWith('/') && !audioSrc.startsWith('http')) {
        audioSrc = '/' + audioSrc;
    }
    
    console.log('[PLAYER] Setting audio source:', audioSrc);
    console.log('[PLAYER] Song data:', songData);
    
    // Clear any previous source elements
    audioPlayer.innerHTML = '';
    
    // Get file extension to determine MIME type
    const extension = audioSrc.split('.').pop().toLowerCase();
    const mimeTypes = {
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4',
        'mp4': 'audio/mp4',
        'aac': 'audio/aac',
        'flac': 'audio/flac',
        'ogg': 'audio/ogg',
        'oga': 'audio/ogg',
        'wav': 'audio/wav',
        'webm': 'audio/webm',
        'opus': 'audio/opus'
    };
    
    // Create source element with explicit MIME type for better compatibility
    const sourceElement = document.createElement('source');
    sourceElement.src = audioSrc;
    sourceElement.type = mimeTypes[extension] || 'audio/mpeg';
    audioPlayer.appendChild(sourceElement);
    
    // Also set the src directly as fallback
    audioPlayer.src = audioSrc;
    audioPlayer.load(); // Force reload with new source
    
    // Check if browser can play this format
    const canPlay = audioPlayer.canPlayType(mimeTypes[extension] || 'audio/mpeg');
    console.log(`[PLAYER] Can play ${extension} (${mimeTypes[extension]}):`, canPlay);
    
    if (canPlay === '') {
        console.warn(`[PLAYER] Browser might not support ${extension} format!`);
        showNotification(`Warning: Your browser might not support ${extension.toUpperCase()} format`, 'error');
    }
    
    // Add error handler for audio loading
    audioPlayer.addEventListener('error', function handleAudioError(e) {
        console.error('Audio error:', e);
        console.error('Audio error details:', audioPlayer.error);
        let errorMessage = 'Cannot play this audio file';
        
        if (audioPlayer.error) {
            switch (audioPlayer.error.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    errorMessage = 'Audio loading aborted';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    errorMessage = 'Network error while loading audio';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    errorMessage = 'Audio format not supported or file corrupted';
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorMessage = 'Audio format not supported by browser';
                    break;
            }
        }
        
        showNotification(`Error: ${errorMessage}`, 'error');
        audioPlayer.removeEventListener('error', handleAudioError);
    }, { once: true });
    
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Error playing music:", error);
            showNotification(`Error: Cannot play ${songData.title}`, 'error');
        });
    }

    // Preload next song in background for gapless playback
    if (currentIndex + 1 < currentQueue.length) {
        preloadNextSong(currentQueue[currentIndex + 1]);
    }

    // Save state after starting playback
    savePlayerState();

    // Dispatch custom event for other scripts
    document.dispatchEvent(new CustomEvent('songChanged', { detail: { songData, index } }));
}

// Preload next song for smoother transitions
let preloadAudio = null;
function preloadNextSong(songData) {
    if (!songData || !songData.audioSrc) return;
    
    // Create or reuse preload audio element
    if (!preloadAudio) {
        preloadAudio = new Audio();
        preloadAudio.preload = 'auto';
    }
    
    // Only preload if different from current preload
    if (preloadAudio.src !== songData.audioSrc) {
        preloadAudio.src = songData.audioSrc;
        preloadAudio.load(); // Start loading in background
    }
}

// Handle when a song is selected to play
window.playSongFromData = function(clickedSong, playlistContext = null) {
    currentQueue = (playlistContext && playlistContext.length > 0) ? [...playlistContext] : [clickedSong];
    
    currentQueue.forEach(song => {
        if (!song.artistData && song.artistName) {
            song.artistData = song.artistName;
        }
    });

    const indexToPlay = currentQueue.findIndex(song => song.audioSrc === clickedSong.audioSrc);

    if (isShuffle && currentQueue.length > 1) {
        const firstSong = currentQueue.splice(indexToPlay, 1)[0];
        currentQueue.sort(() => Math.random() - 0.5);
        currentQueue.unshift(firstSong);
        playSongByIndex(0);
    } else {
        playSongByIndex(indexToPlay);
    }
}

// Attach click event to a song card
function addCardClickListener(cardElement) {
    if (!cardElement) return;

    cardElement.addEventListener('click', () => {
        const songData = {
            _id: cardElement.dataset.id,
            audioSrc: cardElement.dataset.src,
            title: cardElement.dataset.title,
            artistName: cardElement.dataset.artist,
            artUrl: cardElement.dataset.art,
        };

        if (!songData.audioSrc) {
            console.error("Card has no data-src. Cannot play music.", cardElement);
            return;
        }

        const cardGrid = cardElement.closest('.card-grid');
        let playlistContext = [];
        if (cardGrid) {
            const allCardsInSection = cardGrid.querySelectorAll('.card');
            
            // --- START MODIFICATION ---
            allCardsInSection.forEach(card => {
                playlistContext.push({
                    _id: card.dataset.id, // << IMPORTANT: Get ID too
                    audioSrc: card.dataset.src,
                    title: card.dataset.title,
                    artistName: card.dataset.artist,
                    artUrl: card.dataset.art,
                    artistData: card.dataset.artist // Keep for compatibility
                });
            });
            // --- END MODIFICATION ---
        }
        
        window.playSongFromData(songData, playlistContext);
    });
}


// --- INITIALIZE PLAYER WHEN DOM IS READY ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Initializing player.");

    // --- 1. INSERT HTML FOR PLAYER ---
    const playerContainer = document.getElementById('player-bar-container');
    const fullscreenPlayerContainer = document.getElementById('now-playing-fullscreen-container');

    if (!playerContainer || !fullscreenPlayerContainer) {
        console.error("Player container not found. stopping initialization.");
        return;
    }
    
    // A. HTML for Player Bar
    const playerBarHTML = `
        <div class="song-info">
            <img src="img/favicon.png" alt="Now Playing" id="now-playing-art">
            <div class="text-details">
                <h4 id="now-playing-title">No music yet</h4>
                <p id="now-playing-artist">Select a song</p>
            </div>
            <div class="actions">
                <button id="like-btn" title="Like"><svg viewBox="0 0 24 24" width="18" height="18" class="icon-like"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg></button>
            </div>
        </div>
        <div class="player-controls">
            <div class="buttons">
                <button id="shuffle-btn" title="Shuffle"><svg viewBox="0 0 24 24" width="20" height="20" class="icon-shuffle"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"></path></svg></button>
                <button id="prev-btn" title="Previous"><svg viewBox="0 0 24 24" width="20" height="20" class="icon-prev"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg></button>
                <button class="play-pause-btn" id="main-play-pause-btn" title="Play"><svg viewBox="0 0 24 24" width="24" height="24" class="icon-play"><path d="M8 5v14l11-7z"></path></svg></button>
                <button id="next-btn" title="Next"><svg viewBox="0 0 24 24" width="20" height="20" class="icon-next"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg></button>
                <button id="repeat-btn" title="Repeat"><svg viewBox="0 0 24 24" width="20" height="20" class="icon-repeat"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg></button>
            </div>
            <div class="progress-bar-container">
                <span id="current-time">0:00</span>
                <input type="range" id="progress-bar" min="0" max="100" value="0" title="Progress Bar">
                <span id="total-time">0:00</span>
            </div>
        </div>
        <div class="other-controls">
            <button id="volume-btn" title="Volume"><svg viewBox="0 0 24 24" width="18" height="18" class="icon-volume"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></svg></button>
            <div class="volume-bar-container"><input type="range" id="volume-bar" min="0" max="100" value="70" title="Volume Bar"></div>
        </div>
    `;
    playerContainer.className = 'player-bar';
    playerContainer.innerHTML = playerBarHTML;

     // <<<<<<<<<<<< ADD THIS PART BACK >>>>>>>>>>>>>
    fullscreenPlayerContainer.innerHTML = `
        <div class="np-fullscreen" id="now-playing-fullscreen">
            <button class="np-close-btn" id="np-close-btn" title="Close"><svg viewBox="0 0 24 24" width="28" height="28"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg></button>
            <div class="np-art-wrapper"><img src="/img/favicon.png" alt="Album Art" id="np-fullscreen-art"></div>
            <div class="np-details">
                <h2 id="np-fullscreen-title">No music yet</h2>
                <p id="np-fullscreen-artist">Select a song</p>
            </div>
            <div class="np-progress">
                <span id="np-fullscreen-current-time">0:00</span>
                <input type="range" id="np-fullscreen-progress-bar" min="0" max="100" value="0">
                <span id="np-fullscreen-total-time">0:00</span>
            </div>
            <div class="np-controls">
                <button id="np-fullscreen-prev-btn" title="Previous"><svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"></path></svg></button>
                <button id="np-fullscreen-play-pause-btn" class="play-pause-btn" title="Play"><svg viewBox="0 0 24 24" width="60" height="60" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg></button>
                <button id="np-fullscreen-next-btn" title="Next"><svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></path></svg></button>
            </div>
        </div>
    `;
    // <<<<<<<<<<<< END ADDED PART >>>>>>>>>>>>>

    // --- 2. GET DOM ELEMENTS ---
    const audioPlayer = document.getElementById('audio-player');
    const mainPlayPauseBtn = document.getElementById('main-play-pause-btn');
    const progressBar = document.getElementById('progress-bar');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');
    const volumeBar = document.getElementById('volume-bar');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const songInfoDiv = playerContainer.querySelector('.song-info');

    // Fullscreen player elements
    const npCloseBtn = document.getElementById('np-close-btn');
    const nowPlayingArt = document.getElementById('now-playing-art');
    const npFullscreenPlayPauseBtn = document.getElementById('np-fullscreen-play-pause-btn');
    const npFullscreenProgressBar = document.getElementById('np-fullscreen-progress-bar');
    const npFullscreenCurrentTime = document.getElementById('np-fullscreen-current-time');
    const npFullscreenTotalTime = document.getElementById('np-fullscreen-total-time');
    const npFullscreenPrevBtn = document.getElementById('np-fullscreen-prev-btn');
    const npFullscreenNextBtn = document.getElementById('np-fullscreen-next-btn');

    const playIconSVG = '<svg viewBox="0 0 24 24" width="24" height="24" class="icon-play"><path d="M8 5v14l11-7z"></path></svg>';
    const pauseIconSVG = '<svg viewBox="0 0 24 24" width="24" height="24" class="icon-pause"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>';
    const playIconFullscreenSVG = '<svg viewBox="0 0 24 24" width="60" height="60" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>';
    const pauseIconFullscreenSVG = '<svg viewBox="0 0 24 24" width="60" height="60" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>';
    const repeatIconSVG_HTML = '<svg viewBox="0 0 24 24" width="20" height="20" class="icon-repeat"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"></path></svg>';
    const repeatOneIconSVG_HTML = '<svg viewBox="0 0 24 24" width="20" height="20" class="icon-repeat"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zM13 15V9h-1l-2 1v1h1.5v4H13z"></path></svg>';

    // --- FULLSCREEN PLAYER TOGGLE FUNCTIONS ---
    function openFullscreenPlayer() {
        fullscreenPlayerContainer.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeFullscreenPlayer() {
        fullscreenPlayerContainer.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }

    // Open fullscreen when clicking album art in player bar
    if (nowPlayingArt) {
        nowPlayingArt.addEventListener('click', openFullscreenPlayer);
        nowPlayingArt.style.cursor = 'pointer';
        nowPlayingArt.title = 'Click to open fullscreen player';
    }

    // Close fullscreen when clicking close button
    if (npCloseBtn) {
        npCloseBtn.addEventListener('click', closeFullscreenPlayer);
    }

    // Close fullscreen when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fullscreenPlayerContainer.classList.contains('active')) {
            closeFullscreenPlayer();
        }
    });

    const likeBtn = document.getElementById('like-btn'); // Get like button here
    // --- INITIAL LOAD FAVORITES FUNCTION ---
    async function fetchUserFavorites() {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (!userInfo || !userInfo.token) {
            return; // User not logged in, do nothing
        }
        
        try {
            const response = await fetch('/api/songs/favorites', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            if (response.ok) {
                const favoriteSongs = await response.json();
                // Clear old Set and add IDs of liked songs
                userLikedSongIds.clear();
                favoriteSongs.forEach(song => userLikedSongIds.add(song._id));
                console.log(`Loaded ${userLikedSongIds.size} user favorite songs.`);
            }
        } catch (error) {
            console.error("Cannot load favorites list:", error);
        }
    }
    // Call this function immediately upon initialization
    fetchUserFavorites();

    // --- 3. ATTACH EVENTS FOR PLAYER CONTROL BUTTONS ---
    // ADD EVENT FOR LIKE BUTTON ON PLAYER BAR
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            if (!userInfo) {
                showNotification("Please log in to like songs.", 'error');
                return;
            }
            if (currentIndex < 0) {
                showNotification("Please select a song.", 'error');
                return;
            }

            const currentSong = currentQueue[currentIndex];
            const songId = currentSong._id;

            likeBtn.disabled = true; // Disable button

            try {
                const response = await fetch(`/api/songs/${songId}/like`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                });

                if (!response.ok) throw new Error("Operation failed");

                const result = await response.json();
                showNotification(result.message);

                // Update memory and UI
                if (userLikedSongIds.has(songId)) {
                    userLikedSongIds.delete(songId);
                    likeBtn.classList.remove('active');
                    likeBtn.querySelector('svg').setAttribute('fill', 'currentColor');
                } else {
                    userLikedSongIds.add(songId);
                    likeBtn.classList.add('active');
                    likeBtn.querySelector('svg').setAttribute('fill', '#1DB954');
                }
            } catch (error) {
                showNotification("An error occurred, please try again.", 'error');
            } finally {
                likeBtn.disabled = false; // Re-enable button
            }
        });
    }

    function playNext() {
        if (currentQueue.length === 0) return;
        let nextIndex = currentIndex;
        if (isShuffle) {
            nextIndex = Math.floor(Math.random() * currentQueue.length);
            if (currentQueue.length > 1 && nextIndex === currentIndex) {
                playNext(); // Recursion to avoid repeating old song
                return;
            }
        } else {
            nextIndex = (currentIndex + 1) % currentQueue.length;
        }
        playSongByIndex(nextIndex);
    }

    function playPrev() {
        if (currentQueue.length === 0) return;
        if (audioPlayer.currentTime > 3) {
            audioPlayer.currentTime = 0;
            return;
        }
        let prevIndex = isShuffle 
            ? Math.floor(Math.random() * currentQueue.length)
            : (currentIndex - 1 + currentQueue.length) % currentQueue.length;
        playSongByIndex(prevIndex);
    }

    mainPlayPauseBtn.addEventListener('click', () => {
        if (!audioPlayer.src) {
            if (currentQueue.length > 0) playSongByIndex(0);
            else showNotification("Please select a song", 'error');
            return;
        }
        audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
    });

    nextBtn.addEventListener('click', playNext);
    prevBtn.addEventListener('click', playPrev);

    shuffleBtn.addEventListener('click', () => {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        showNotification(isShuffle ? "Shuffle on" : "Shuffle off");
    });

    repeatBtn.addEventListener('click', () => {
        const modes = ['none', 'all', 'one'];
        const messages = { "all": "Repeat all", "one": "Repeat one", "none": "Repeat off" };
        let currentModeIndex = modes.indexOf(repeatMode);
        repeatMode = modes[(currentModeIndex + 1) % modes.length];
        
        showNotification(messages[repeatMode]);
        repeatBtn.classList.toggle('active', repeatMode !== 'none');
        repeatBtn.innerHTML = repeatMode === 'one' ? repeatOneIconSVG_HTML : repeatIconSVG_HTML;
    });

    volumeBar.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value / 100;
        audioPlayer.muted = (e.target.value == 0);
    });

    audioPlayer.addEventListener('volumechange', () => {
        volumeBar.value = audioPlayer.muted ? 0 : audioPlayer.volume * 100;
    });

    progressBar.addEventListener('input', (e) => {
        if (audioPlayer.src) {
            audioPlayer.currentTime = e.target.value;
        }
    });

    audioPlayer.addEventListener('play', () => {
        mainPlayPauseBtn.innerHTML = pauseIconSVG;
        if (npFullscreenPlayPauseBtn) npFullscreenPlayPauseBtn.innerHTML = pauseIconFullscreenSVG;
        savePlayerState();
    });
    audioPlayer.addEventListener('pause', () => {
        mainPlayPauseBtn.innerHTML = playIconSVG;
        if (npFullscreenPlayPauseBtn) npFullscreenPlayPauseBtn.innerHTML = playIconFullscreenSVG;
        savePlayerState();
    });

    let lastSaveTime = 0;
    audioPlayer.addEventListener('timeupdate', () => {
        if (isNaN(audioPlayer.duration)) return;
        progressBar.value = audioPlayer.currentTime;
        currentTimeEl.textContent = window.formatTime(audioPlayer.currentTime);
        
        // Update fullscreen player progress
        if (npFullscreenProgressBar) npFullscreenProgressBar.value = audioPlayer.currentTime;
        if (npFullscreenCurrentTime) npFullscreenCurrentTime.textContent = window.formatTime(audioPlayer.currentTime);
        
        // Save state every 1 second during playback for near-instant recovery
        const currentTime = audioPlayer.currentTime;
        if (currentTime - lastSaveTime >= 1) {
            savePlayerState();
            lastSaveTime = currentTime;
        }
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        progressBar.max = audioPlayer.duration;
        totalTimeEl.textContent = window.formatTime(audioPlayer.duration);
        
        // Update fullscreen player metadata
        if (npFullscreenProgressBar) npFullscreenProgressBar.max = audioPlayer.duration;
        if (npFullscreenTotalTime) npFullscreenTotalTime.textContent = window.formatTime(audioPlayer.duration);
    });

    // --- FULLSCREEN PLAYER CONTROLS ---
    // Fullscreen play/pause button
    if (npFullscreenPlayPauseBtn) {
        npFullscreenPlayPauseBtn.addEventListener('click', () => {
            if (!audioPlayer.src) {
                if (currentQueue.length > 0) playSongByIndex(0);
                else showNotification("Please select a song", 'error');
                return;
            }
            audioPlayer.paused ? audioPlayer.play() : audioPlayer.pause();
        });
    }

    // Fullscreen progress bar
    if (npFullscreenProgressBar) {
        npFullscreenProgressBar.addEventListener('input', (e) => {
            if (audioPlayer.src) {
                audioPlayer.currentTime = e.target.value;
            }
        });
    }

    // Fullscreen prev/next buttons
    if (npFullscreenPrevBtn) {
        npFullscreenPrevBtn.addEventListener('click', playPrev);
    }
    if (npFullscreenNextBtn) {
        npFullscreenNextBtn.addEventListener('click', playNext);
    }

    audioPlayer.addEventListener('ended', () => {
        if (repeatMode === 'one') {
            playSongByIndex(currentIndex);
        } else if (repeatMode === 'none' && !isShuffle && currentIndex === currentQueue.length - 1) {
            // Queue ended, stop
            mainPlayPauseBtn.innerHTML = playIconSVG;
            document.title = "MyMusic Player";
            updateFavicon("/img/favicon.png");
        } else {
            playNext();
        }
    });

    // --- 4. ATTACH EVENTS TO SONG CARDS ON PAGE ---
    console.log("Starting to find and attach listeners to song cards.");
    const songCards = document.querySelectorAll('.card');
    console.log(`Found ${songCards.length} cards.`);

    if (songCards.length > 0) {
        songCards.forEach(card => {
            addCardClickListener(card);
        });
        console.log("Finished attaching listeners to cards.");
    } else {
        console.warn("No song cards found on page.");
    }

    // --- 5. RESTORE PLAYER STATE FROM PREVIOUS SESSION ---
    console.log("Attempting to restore player state...");
    const restored = restorePlayerState();
    if (restored) {
        console.log("Player state restored successfully from localStorage.");
    } else {
        console.log("No previous player state found or restoration failed.");
    }

    console.log("Player initialization complete.");
});