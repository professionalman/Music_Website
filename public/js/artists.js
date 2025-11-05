// js/artists.js (Hoàn chỉnh với ảnh dự phòng)

document.addEventListener('DOMContentLoaded', () => {
    console.log("Artists DOMContentLoaded Start");

    const artistsGridContainer = document.getElementById('artists-grid');
    const fallbackImage = 'img/singer-holder.png'; // Define fallback image

    // --- Function to create a card for an artist ---
    function createArtistCard(artistData) {
        if (!artistData || !artistData.id || !artistData.name) return null;

        const card = document.createElement('a');
        card.href = `artist_page?artistId=${encodeURIComponent(artistData.id)}`;
        card.classList.add('card', 'artist-card');

        // Use artistData.avatarUrl if available, otherwise use fallbackImage
        // Added onError to load fallback if main image fails to load
        card.innerHTML = `
            <img src="${artistData.avatarUrl || fallbackImage}" alt="${artistData.name}" class="album-art" loading="lazy" onerror="this.onerror=null;this.src='${fallbackImage}';">
            <h3 class="artist-card-name">${artistData.name}</h3>
            <p class="artist-card-type">Artist</p>
        `;
        return card;
    }

    // --- Automatically generate artist list from ALL_MUSIC_SECTIONS ---
    if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && artistsGridContainer) {
        artistsGridContainer.innerHTML = '';

        const artistsMap = new Map();

        ALL_MUSIC_SECTIONS.flatMap(section => section.songs).forEach(song => {
            if (song.displayArtist && song.displayArtist.id) {
                if (!artistsMap.has(song.displayArtist.id)) {
                    artistsMap.set(song.displayArtist.id, {
                        id: song.displayArtist.id,
                        name: song.displayArtist.name,
                        // Use song cover art as avatar initially.
                        // If you have a separate artist avatar URL, use it here instead of song.artUrl
                        avatarUrl: song.artUrl
                    });
                }
            }
        });

        const uniqueArtists = Array.from(artistsMap.values());

        if (uniqueArtists.length > 0) {
            uniqueArtists.sort((a, b) => a.name.localeCompare(b.name));
            uniqueArtists.forEach(artist => {
                const artistCardElement = createArtistCard(artist);
                if (artistCardElement) {
                    artistsGridContainer.appendChild(artistCardElement);
                }
            });
        } else {
            artistsGridContainer.innerHTML = '<p>No artist information available yet.</p>';
        }

    } else {
        if (artistsGridContainer) artistsGridContainer.innerHTML = '<p>Error loading artist list.</p>';
    }

    console.log("Artists DOMContentLoaded End");
});