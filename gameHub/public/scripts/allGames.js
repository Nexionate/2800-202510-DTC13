let currentPage = 1;
let searchName = '';
document.addEventListener('DOMContentLoaded', () => {
    const searchName = document.body.dataset.searchName || '';
    const wrapper = document.getElementById('kenburns-bg-wrapper');

    fetch('/api/allGameBG')
    .then(res => res.json())
    .then(data => {
        data.results.forEach(game => {
        if (game.background_image) {
            const bg = document.createElement('div');
            bg.className = 'kenburns-image';
            bg.style.backgroundImage = `url(${game.background_image})`;
            wrapper.appendChild(bg);
        }
        });
    });


  // Apply Filters
  document.getElementById('applyFilters').addEventListener('click', () => {
    currentPage = 1;
    fetchGames(currentPage);
  });

  // Next Page
  document.getElementById('nextPage').addEventListener('click', () => {
    currentPage++;
    fetchGames(currentPage);
  });

  // Previous Page
  document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      fetchGames(currentPage);
    }
  });

  fetchGames(currentPage)
  loadFilterOptions();
});

function starRating(rating) {
    const maxStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = maxStars - fullStars - (halfStar ? 1 : 0);

    let starHTML = '';

    for (let i = 0; i < fullStars; i++) {
        starHTML += '<i class="fas fa-star" style="color: gold;"></i>';
    }

    if (halfStar) {
        starHTML += '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
    }

    for (let i = 0; i < emptyStars; i++) {
        starHTML += '<i class="far fa-star" style="color: lightgray;"></i>';
    }

    return starHTML;
}

async function loadFilterOptions() {
  try {
    const res = await fetch('/api/genres');
    const genres = await res.json();
    populateSelect('genre', genres.results);
  } catch (err) {
    console.error('Error loading genres:', err);
  }
}

async function fetchGames(page = 1) {
  const genre = document.getElementById('genre').value;
  const ordering = document.getElementById('ordering').value;
  searchName = document.body.dataset.searchName || ''

  const params = new URLSearchParams({
    page,
    genre,
    ordering,
    search: searchName !== 'All Games' ? searchName : ''
  });

  try {
    const response = await fetch(`/api/games?${params.toString()}`);
    const data = await response.json();
    renderGames(data.results);
    document.getElementById('pageNum').textContent = `Page ${page}`;
  } catch (err) {
    console.error('Error fetching games:', err);
  }
}

function populateSelect(id, items) {
    const select = document.getElementById(id);
    items.forEach((item) => {
      const option = document.createElement('option');
      option.value = item.slug || item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });
}

function renderGames(games) {
  const grid = document.getElementById('game-grid');
  grid.innerHTML = ''; // Clear current content

  games.forEach((game) => {
  const div = document.createElement('div');
  div.classList.add('game-card');
  
  div.innerHTML = `
      <a href="/gameDescription/${game.id}">
          <img class="game-image" src="${game.background_image}" alt="${game.name}"/>
          <div id="rating">
          <h2><b>${game.name}</b></h2>
          <h4>Rating ${game.rating}<h4>
          <span>${starRating(game.rating)}</span>
          </div>
      </a>
  `;
  grid.appendChild(div);
  });
}