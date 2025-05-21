const apiKey = 'f61c15c68f3246a3aeebcfa53cdef84f';  // Replace with your actual RAWG API key
let currentPage = 1;

async function fetchGames(page = 1) {
    const url = `https://api.rawg.io/api/games?key=${apiKey}&page_size=20&page=${page}`;

    const response = await fetch(url);
    const data = await response.json();

    renderGames(data.results);
    document.getElementById('pageNum').textContent = `Page ${page}`;
}

function renderGames(games) {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = ''; // Clear current content

    games.forEach(game => {
        const div = document.createElement('div');
        div.classList.add('game-card');
        div.innerHTML = `
      <img src="${game.background_image}" alt="${game.name}" />
      <h3>${game.name}</h3>
    `;
        grid.appendChild(div);
    });
}

// Pagination handlers
document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    fetchGames(currentPage);
});

document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchGames(currentPage);
    }
});

// Initial load
fetchGames(currentPage);
