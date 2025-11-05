// // utils.js

// // --- Hàm tạo một card bài hát ---
// // Hàm này sẽ được gọi từ main.js và search.js
// // --- Hàm tạo một card bài hát ---
// function createSongCard(songData) {
//     const card = document.createElement('div');
//     card.classList.add('card');

//     // Gán dataset để player.js có thể đọc
//     card.dataset.id = songData._id || ''; 
//     card.dataset.src = songData.audioSrc || '';
//     card.dataset.title = songData.title || 'Không có tiêu đề';
//     card.dataset.artist = songData.artistData || songData.displayArtist?.name || songData.artistName || 'N/A';
//     card.dataset.art = songData.artUrl || '/img/song-holder.png';

//     // Dùng artistName từ dữ liệu API nếu có
//     const artistText = songData.displayArtist?.name || songData.artistName || 'Nghệ sĩ không xác định';

//     card.innerHTML = `
//         <img src="/${songData.artUrl || 'img/song-holder.png'}" alt="${songData.title}" class="album-art" loading="lazy">
//         <h3 class="song-title">${songData.title || 'Không có tiêu đề'}</h3>
//         <p class="song-artist">${artistText}</p>
//         <button class="play-button-overlay">▶</button>
//     `;

//     // **QUAN TRỌNG:** Xóa bỏ hoàn toàn khối if (typeof window.addCardClickListener)
//     // Việc gắn listener sẽ do file gọi hàm này (main.js, library.js...) hoặc script inline đảm nhiệm.

//     return card;
// }

// // Hàm format thời gian (MM:SS)
// function formatTime(seconds) {
//     if (isNaN(seconds)) return "0:00";
//     const minutes = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
// }
// // --- Hàm render các link playlist trong sidebar ---
// // sectionsData: Mảng dữ liệu (ví dụ: ALL_MUSIC_SECTIONS)
// // targetUlElement: Phần tử <ul> trong sidebar để chèn link vào
// // --- Hàm render các link playlist trong sidebar ---
// function renderPlaylistLinks(sectionsData, targetUlElement) {
//     if (!targetUlElement) return;
//     if (!sectionsData || !Array.isArray(sectionsData)) {
//         targetUlElement.innerHTML = '<li>Lỗi tải playlist</li>'; return;
//     }
//     targetUlElement.innerHTML = '';


//     const currentPage = window.location.pathname.split("/").pop();
//     const urlParams = new URLSearchParams(window.location.search);
//     const currentPlaylistId = urlParams.get('id');

//     sectionsData.forEach(section => {
//         if (section && section.id && section.title) {
//             const listItem = document.createElement('li');
//             const link = document.createElement('a');
//             link.href = `playlist?id=${encodeURIComponent(section.id)}`;
//             link.textContent = section.title;
//             if (currentPage === 'playlist' && currentPlaylistId === section.id) {
//                 link.classList.add('active-playlist-link');
//             }
//             listItem.appendChild(link);
//             targetUlElement.appendChild(listItem);
//         }
//     });

// }




// // --- HÀM TẠO MỘT MỤC BÀI HÁT TRONG DANH SÁCH (DẠNG BẢNG) - PHIÊN BẢN HOÀN CHỈNH ---
// function createSongListItem(songData, index, artistNameToDisplay) {
//     const songItem = document.createElement('div');
//     songItem.className = 'song-list-item';
    
//     // Gán data-id để đồng bộ hóa trạng thái like
//     songItem.dataset.id = songData._id || '';

//     const artistName = artistNameToDisplay || songData.artistName || 'Nghệ sĩ không xác định';

//     // Cấu trúc HTML với cột Actions
//     songItem.innerHTML = `
//         <span class="song-index">${index}</span>
//         <img src="/${songData.artUrl || 'img/song-holder.png'}" alt="${songData.title || 'Art'}" class="album-art-small">
//         <div class="song-details" data-artist="${artistName}">
//             <div class="song-title">${songData.title || 'Không có tiêu đề'}</div>
//         </div>
//         <div class="song-artist-column">${artistName}</div>
//         <div class="song-plays">${(songData.plays || 0).toLocaleString('vi-VN')}</div>
//         <div class="song-actions">
//             <button title="Thích" class="like-song-btn">
//                 <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
//                     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
//                 </svg>
//             </button>
//         </div>
//     `;

//     const likeBtn = songItem.querySelector('.like-song-btn');
//     if (likeBtn) {
//         // Kiểm tra trạng thái "like" ban đầu từ biến toàn cục
//         // `window.userLikedSongIds` được định nghĩa và tải trong player.js
//         if (window.userLikedSongIds && window.userLikedSongIds.has(songData._id)) {
//             likeBtn.classList.add('liked');
//             likeBtn.querySelector('svg').setAttribute('fill', '#1DB954');
//         }

//         // Gắn sự kiện click để phát ra một sự kiện tùy chỉnh
//         likeBtn.addEventListener('click', (e) => {
//             e.stopPropagation(); // Ngăn việc phát nhạc khi chỉ click vào nút tim
            
//             // player.js sẽ lắng nghe sự kiện 'toggleLike' này
//             const likeEvent = new CustomEvent('toggleLike', { 
//                 detail: { songId: songData._id } 
//             });
//             document.dispatchEvent(likeEvent);
//         });
//     }

//     return songItem;
// }

// // --- EXPOSE CÁC HÀM RA GLOBAL SCOPE ---
// // Đảm bảo bạn đã "expose" các hàm này ra để các file khác có thể dùng
// window.createSongCard = createSongCard;
// window.formatTime = formatTime;
// window.renderPlaylistLinks = renderPlaylistLinks;
// window.createSongListItem = createSongListItem; // << THÊM DÒNG NÀY

// console.log("utils.js loaded with all utility functions.");// utils.js

// // --- Hàm tạo một card bài hát ---
// // Hàm này sẽ được gọi từ main.js và search.js
// // --- Hàm tạo một card bài hát ---
// function createSongCard(songData) {
//     const card = document.createElement('div');
//     card.classList.add('card');

//     // Gán dataset để player.js có thể đọc
//     card.dataset.id = songData._id || ''; 
//     card.dataset.src = songData.audioSrc || '';
//     card.dataset.title = songData.title || 'Không có tiêu đề';
//     card.dataset.artist = songData.artistData || songData.displayArtist?.name || songData.artistName || 'N/A';
//     card.dataset.art = songData.artUrl || '/img/song-holder.png';

//     // Dùng artistName từ dữ liệu API nếu có
//     const artistText = songData.displayArtist?.name || songData.artistName || 'Nghệ sĩ không xác định';

//     card.innerHTML = `
//         <img src="/${songData.artUrl || 'img/song-holder.png'}" alt="${songData.title}" class="album-art" loading="lazy">
//         <h3 class="song-title">${songData.title || 'Không có tiêu đề'}</h3>
//         <p class="song-artist">${artistText}</p>
//         <button class="play-button-overlay">▶</button>
//     `;

//     // **QUAN TRỌNG:** Xóa bỏ hoàn toàn khối if (typeof window.addCardClickListener)
//     // Việc gắn listener sẽ do file gọi hàm này (main.js, library.js...) hoặc script inline đảm nhiệm.

//     return card;
// }

// // Hàm format thời gian (MM:SS)
// function formatTime(seconds) {
//     if (isNaN(seconds)) return "0:00";
//     const minutes = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
// }
// // --- Hàm render các link playlist trong sidebar ---
// // sectionsData: Mảng dữ liệu (ví dụ: ALL_MUSIC_SECTIONS)
// // targetUlElement: Phần tử <ul> trong sidebar để chèn link vào
// // --- Hàm render các link playlist trong sidebar ---
// function renderPlaylistLinks(sectionsData, targetUlElement) {
//     if (!targetUlElement) return;
//     if (!sectionsData || !Array.isArray(sectionsData)) {
//         targetUlElement.innerHTML = '<li>Lỗi tải playlist</li>'; return;
//     }
//     targetUlElement.innerHTML = '';


//     const currentPage = window.location.pathname.split("/").pop();
//     const urlParams = new URLSearchParams(window.location.search);
//     const currentPlaylistId = urlParams.get('id');

//     sectionsData.forEach(section => {
//         if (section && section.id && section.title) {
//             const listItem = document.createElement('li');
//             const link = document.createElement('a');
//             link.href = `playlist?id=${encodeURIComponent(section.id)}`;
//             link.textContent = section.title;
//             if (currentPage === 'playlist' && currentPlaylistId === section.id) {
//                 link.classList.add('active-playlist-link');
//             }
//             listItem.appendChild(link);
//             targetUlElement.appendChild(listItem);
//         }
//     });

// }




// // --- HÀM TẠO MỘT MỤC BÀI HÁT TRONG DANH SÁCH (DẠNG BẢNG) - PHIÊN BẢN HOÀN CHỈNH ---
// function createSongListItem(songData, index, artistNameToDisplay) {
//     const songItem = document.createElement('div');
//     songItem.className = 'song-list-item';
    
//     // Gán data-id để đồng bộ hóa trạng thái like
//     songItem.dataset.id = songData._id || '';

//     const artistName = artistNameToDisplay || songData.artistName || 'Nghệ sĩ không xác định';

//     // Cấu trúc HTML với cột Actions
//     songItem.innerHTML = `
//         <span class="song-index">${index}</span>
//         <img src="/${songData.artUrl || 'img/song-holder.png'}" alt="${songData.title || 'Art'}" class="album-art-small">
//         <div class="song-details" data-artist="${artistName}">
//             <div class="song-title">${songData.title || 'Không có tiêu đề'}</div>
//         </div>
//         <div class="song-artist-column">${artistName}</div>
//         <div class="song-plays">${(songData.plays || 0).toLocaleString('vi-VN')}</div>
//         <div class="song-actions">
//             <button title="Thích" class="like-song-btn">
//                 <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
//                     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
//                 </svg>
//             </button>
//         </div>
//     `;

//     const likeBtn = songItem.querySelector('.like-song-btn');
//     if (likeBtn) {
//         // Kiểm tra trạng thái "like" ban đầu từ biến toàn cục
//         // `window.userLikedSongIds` được định nghĩa và tải trong player.js
//         if (window.userLikedSongIds && window.userLikedSongIds.has(songData._id)) {
//             likeBtn.classList.add('liked');
//             likeBtn.querySelector('svg').setAttribute('fill', '#1DB954');
//         }

//         // Gắn sự kiện click để phát ra một sự kiện tùy chỉnh
//         likeBtn.addEventListener('click', (e) => {
//             e.stopPropagation(); // Ngăn việc phát nhạc khi chỉ click vào nút tim
            
//             // player.js sẽ lắng nghe sự kiện 'toggleLike' này
//             const likeEvent = new CustomEvent('toggleLike', { 
//                 detail: { songId: songData._id } 
//             });
//             document.dispatchEvent(likeEvent);
//         });
//     }

//     return songItem;
// }

// // --- EXPOSE CÁC HÀM RA GLOBAL SCOPE ---
// // Đảm bảo bạn đã "expose" các hàm này ra để các file khác có thể dùng
// window.createSongCard = createSongCard;
// window.formatTime = formatTime;
// window.renderPlaylistLinks = renderPlaylistLinks;
// window.createSongListItem = createSongListItem; // << THÊM DÒNG NÀY

// console.log("utils.js loaded with all utility functions.");


// utils.js

// --- Function to create a song card ---
// This function will be called from main.js and search.js
// --- Function to create a song card ---
function createSongCard(songData) {
    const card = document.createElement('div');
    card.classList.add('card');

    // Set dataset for player.js to read
    card.dataset.id = songData._id || '';
    card.dataset.src = songData.audioSrc || '';
    card.dataset.title = songData.title || 'Untitled';
    card.dataset.artist = songData.artistData || songData.displayArtist?.name || songData.artistName || 'N/A';
    card.dataset.art = songData.artUrl || '/img/song-holder.png';

    // Use artistName from API data if available
    const artistText = songData.displayArtist?.name || songData.artistName || 'Unknown Artist';

    card.innerHTML = `
        <img src="/${songData.artUrl || 'img/song-holder.png'}" alt="${songData.title}" class="album-art" loading="lazy">
        <h3 class="song-title">${songData.title || 'Untitled'}</h3>
        <p class="song-artist">${artistText}</p>
        <button class="play-button-overlay">▶</button>
    `;

    // **IMPORTANT:** Completely remove the if (typeof window.addCardClickListener) block
    // Attaching listener will be handled by the file calling this function (main.js, library.js...) or inline script.

    return card;
}

// Time formatting function (MM:SS)
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
// --- Function to render playlist links in sidebar ---
// sectionsData: Data array (e.g., ALL_MUSIC_SECTIONS)
// targetUlElement: <ul> element in sidebar to insert links into
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




// --- FUNCTION TO CREATE A SONG ITEM IN LIST (TABLE STYLE) - COMPLETE VERSION ---
function createSongListItem(songData, index, artistNameToDisplay) {
    const songItem = document.createElement('div');
    songItem.className = 'song-list-item';
    
    // Set data-id to synchronize like status
    songItem.dataset.id = songData._id || '';

    const artistName = artistNameToDisplay || songData.artistName || 'Unknown Artist';

    // HTML structure with Actions column
    songItem.innerHTML = `
        <span class="song-index">${index}</span>
        <img src="/${songData.artUrl || 'img/song-holder.png'}" alt="${songData.title || 'Art'}" class="album-art-small">
        <div class="song-details" data-artist="${artistName}">
            <div class="song-title">${songData.title || 'Untitled'}</div>
        </div>
        <div class="song-artist-column">${artistName}</div>
        <div class="song-plays">${(songData.plays || 0).toLocaleString('en-US')}</div>
        <div class="song-actions">
            <button title="Like" class="like-song-btn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
            </button>
        </div>
    `;

    // **QUAN TRỌNG:** Xóa bỏ hoàn toàn khối if (typeof window.addCardClickListener)
    // Việc gắn listener sẽ do file gọi hàm này (main.js, library.js...) hoặc script inline đảm nhiệm.

    // Inject admin edit/delete buttons into .song-actions if user is admin
    try {
        const userInfoRaw = localStorage.getItem('userInfo');
        const userInfo = userInfoRaw ? JSON.parse(userInfoRaw) : null;
        if (userInfo && userInfo.role === 'admin') {
            const actionsDiv = songItem.querySelector('.song-actions');
            if (actionsDiv) {
                const editBtn = document.createElement('button');
                editBtn.className = 'icon-btn btn-edit-list';
                editBtn.title = 'Edit';
                editBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.0001 1.0001 0 0 0 0-1.41l-2.34-2.34a1.0001 1.0001 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>`;
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.location.href = `/admin_song?id=${encodeURIComponent(songData._id)}`;
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'icon-btn btn-delete-list';
                deleteBtn.title = 'Delete';
                deleteBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>`;
                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (!confirm('Delete this song?')) return;
                    try {
                        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                        const token = userInfo?.token;
                        const res = await fetch(`/api/admin/songs/${songData._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || 'Delete failed');
                        // Remove the item from DOM
                        songItem.remove();
                    } catch (err) {
                        alert(err.message || 'Delete failed');
                    }
                });

                // Insert edit/delete before like button
                actionsDiv.insertBefore(deleteBtn, actionsDiv.firstChild);
                actionsDiv.insertBefore(editBtn, actionsDiv.firstChild);
            }
        }
    } catch (e) {
        // ignore
    }

    const likeBtn = songItem.querySelector('.like-song-btn');
    if (likeBtn) {
        // Check initial "like" status from global variable
        // `window.userLikedSongIds` is defined and loaded in player.js
        if (window.userLikedSongIds && window.userLikedSongIds.has(songData._id)) {
            likeBtn.classList.add('liked');
            likeBtn.querySelector('svg').setAttribute('fill', '#1DB954');
        }

        // Attach click event to dispatch a custom event
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent playing music when only clicking heart button
            
            // player.js will listen to this 'toggleLike' event
            const likeEvent = new CustomEvent('toggleLike', { 
                detail: { songId: songData._id } 
            });
            document.dispatchEvent(likeEvent);
        });
    }

    return songItem;
}

// --- EXPOSE FUNCTIONS TO GLOBAL SCOPE ---
// Ensure you have "exposed" these functions so other files can use them
window.createSongCard = createSongCard;
window.formatTime = formatTime;
window.renderPlaylistLinks = renderPlaylistLinks;
window.createSongListItem = createSongListItem; // << ADD THIS LINE

console.log("utils.js loaded with all utility functions.");