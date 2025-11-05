// all_song.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main DOMContentLoaded Start");

    const mainMusicContainer = document.getElementById('main-music-content');
    const playlistUl = document.getElementById('playlist-links-list');

    // --- Render music sections from data ---
    if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && mainMusicContainer) {
        // ... (Your renderMusicSections code, ensuring it uses window.createSongCard) ...
        renderMusicSections(ALL_MUSIC_SECTIONS, mainMusicContainer);
    } else {
        console.error("ALL_MUSIC_SECTIONS data or main container not found.");
    }

    // --- Create dynamic playlist links in sidebar (Call function from utils.js) ---
    if (typeof ALL_MUSIC_SECTIONS !== 'undefined' && playlistUl && typeof window.renderPlaylistLinks === 'function') {
        window.renderPlaylistLinks(ALL_MUSIC_SECTIONS, playlistUl);

        // Attach listener for smooth scroll AFTER CREATING LINKS (Call function from utils.js)
        if (typeof window.attachSmoothScrollListeners === 'function') {
             // Only attach smooth scroll on index page as it has corresponding sections
             window.attachSmoothScrollListeners('#playlist-links-list li a', '.main-content');
        } else {
             console.error("Function attachSmoothScrollListeners does not exist.");
        }

    } else {
          console.error("Error: Music data, playlist ul, or renderPlaylistLinks function not found.");
    }

    // --- Function to render music sections (still needed here as it's specific to index.html) ---
     function renderMusicSections(sectionsData, containerElement) {
        // ... (renderMusicSections function code as before, calls window.createSongCard) ...
        if (!containerElement || !sectionsData) return;

         // Remove old H1 if necessary
         const existingH1 = containerElement.querySelector('h1');
         if(existingH1) containerElement.removeChild(existingH1);

         // Render welcome title
         const welcomeTitle = document.createElement('h1');
         welcomeTitle.textContent = 'Hello Trần Hữu Đạt'; // Or get user name
         containerElement.appendChild(welcomeTitle);


        sectionsData.forEach(section => {
            const sectionElement = document.createElement('section');
            sectionElement.id = section.id; // Assign ID
            sectionElement.classList.add('content-section');

            const titleElement = document.createElement('h2');
            titleElement.textContent = section.title;

            const cardGridElement = document.createElement('div');
            cardGridElement.classList.add('card-grid');

            if (section.songs && section.songs.length > 0) {
                section.songs.forEach(song => {
                    if (typeof window.createSongCard === 'function') {
                        const card = window.createSongCard(song);
                        cardGridElement.appendChild(card);
                    } else {
                         console.error("Function createSongCard does not exist when rendering section.");
                    }
                });
            } else {
                const noSongsMessage = document.createElement('p');
                noSongsMessage.textContent = 'No songs in this section yet.';
                cardGridElement.appendChild(noSongsMessage);
            }

            sectionElement.appendChild(titleElement);
            sectionElement.appendChild(cardGridElement);
            containerElement.appendChild(sectionElement);
        });
     }
     
    // CALL FUNCTION TO INSERT FOOTER AFTER EVERYTHING IS DONE
    if (typeof window.appendMainFooter === 'function') {
        window.appendMainFooter();
    }
    console.log("Main DOMContentLoaded End");
});

console.log("main.js loaded"); // To check load order