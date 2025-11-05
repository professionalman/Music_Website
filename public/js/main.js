// js/main.js (New version for "Discover" home page)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main (Home) DOMContentLoaded Start");

    const homeContentContainer = document.getElementById('home-content');
    if (!homeContentContainer) {
        console.error("Could not find #home-content container.");
        return;
    }

    // Clear "Loading..." message
    homeContentContainer.innerHTML = '';

    // --- RENDER FUNCTIONS FOR EACH WIDGET TYPE ---

    /**
     * Render a standard section of song/playlist cards
     * @param {object} sectionData - Section data from ALL_MUSIC_SECTIONS
     */
    function renderStandardSection(sectionData) {
        if (!sectionData || !sectionData.songs || sectionData.songs.length === 0) return;

        const sectionEl = document.createElement('section');
        sectionEl.classList.add('content-section');

        const titleEl = document.createElement('h2');
        titleEl.classList.add('section-title');
        titleEl.textContent = sectionData.title;

        const gridEl = document.createElement('div');
        gridEl.classList.add('card-grid');

        sectionData.songs.slice(0, 6).forEach(song => { // Only show first 6 songs
            const card = createSongCard(song);
            if (typeof addCardClickListener === 'function') {
                addCardClickListener(card);
            }
            gridEl.appendChild(card);
        });

        sectionEl.appendChild(titleEl);
        sectionEl.appendChild(gridEl);
        homeContentContainer.appendChild(sectionEl);
    }

    /**
     * Render featured artists widget
     * @param {number} count - Number of artists to display
     */
    function renderTopArtistsWidget(count = 6) {
        const artistsMap = new Map();
        ALL_MUSIC_SECTIONS.flatMap(s => s.songs).forEach(song => {
            if (song.displayArtist && song.displayArtist.id && !artistsMap.has(song.displayArtist.id)) {
                artistsMap.set(song.displayArtist.id, {
                    id: song.displayArtist.id,
                    name: song.displayArtist.name,
                    avatarUrl: song.artUrl // Use cover art as avatar
                });
            }
        });

        const uniqueArtists = Array.from(artistsMap.values());
        if (uniqueArtists.length === 0) return;

        const sectionEl = document.createElement('section');
        sectionEl.classList.add('content-section');
        sectionEl.innerHTML = `<h2 class="section-title">Featured Artists</h2>`;

        const gridEl = document.createElement('div');
        gridEl.classList.add('card-grid');

        uniqueArtists.slice(0, count).forEach(artist => {
            const card = document.createElement('a');
            card.href = `artist_page.html?artistId=${artist.id}`;
            card.classList.add('card', 'artist-card'); // Use artist card style
            card.innerHTML = `
                <img src="${artist.avatarUrl || 'img/singer-holder.png'}" alt="${artist.name}" class="album-art">
                <h3 class="artist-card-name">${artist.name}</h3>
                <p class="artist-card-type">Artist</p>
            `;
            gridEl.appendChild(card);
        });

        sectionEl.appendChild(gridEl);
        homeContentContainer.appendChild(sectionEl);
    }

    /**
     * Render "Daily Mix" playlists widget
     * Randomly select playlists from ALL_MUSIC_SECTIONS to simulate
     */
    function renderDailyMixWidget(count = 6) {
        if (typeof ALL_MUSIC_SECTIONS === 'undefined' || ALL_MUSIC_SECTIONS.length === 0) return;

        // Shuffle sections randomly to simulate "Daily Mix"
        const shuffledSections = [...ALL_MUSIC_SECTIONS].sort(() => 0.5 - Math.random());

        const sectionEl = document.createElement('section');
        sectionEl.classList.add('content-section');
        sectionEl.innerHTML = `<h2 class="section-title">Random Playlists <a href="all_playlists.html">(See All Playlists)</a></h2>`;

        const gridEl = document.createElement('div');
        gridEl.classList.add('card-grid');

        shuffledSections.slice(0, count).forEach((playlist, index) => {
            const card = document.createElement('a');
            card.href = `playlist.html?id=${playlist.id}`;
            card.classList.add('card', 'playlist-card'); // Can have specific style for playlist card

            const coverArt = (playlist.songs && playlist.songs.length > 0) ? playlist.songs[0].artUrl : 'img/song-holder.png';

            card.innerHTML = `
                <img src="${coverArt}" alt="${playlist.title}" class="album-art">
                <h3 class="song-title">Daily Mix ${index + 1}</h3>
                <p class="song-artist">${playlist.title}</p>
            `;
            gridEl.appendChild(card);
        });

        sectionEl.appendChild(gridEl);
        homeContentContainer.appendChild(sectionEl);
    }

    // --- BUILD HOME PAGE ---
    // Now you can call render functions in the order you want

    // 1. Welcome
    const welcomeHeader = document.createElement('h1');
    welcomeHeader.textContent = "Hello Trần Hữu Đạt";
    homeContentContainer.appendChild(welcomeHeader);

    // 2. Render Daily Mix widget
    renderDailyMixWidget(6);

    // 3. Render some standard music sections
    if (typeof ALL_MUSIC_SECTIONS !== 'undefined') {
        renderStandardSection(ALL_MUSIC_SECTIONS.find(s => s.id === 'Vpop'));
        renderStandardSection(ALL_MUSIC_SECTIONS.find(s => s.id === 'VpopRemix'));
        renderStandardSection(ALL_MUSIC_SECTIONS.find(s => s.id === 'ElectronicEDM'));
    }

    // 4. Render Featured Artists widget
    renderTopArtistsWidget(6);

    // CALL FUNCTION TO INSERT FOOTER AFTER EVERYTHING IS DONE
    if (typeof window.appendMainFooter === 'function') {
        window.appendMainFooter();
    }
    console.log("Main (Home) DOMContentLoaded End");
});