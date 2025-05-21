document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('kenburns-bg-wrapper');

    fetch('/api/createLobbyBG')
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
});

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('gameSearch');
  const resultsList = document.getElementById('searchResults');
  const hiddenInput = document.getElementById('gameName');

  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();

    if (query.length < 2) {
      resultsList.innerHTML = '';
      resultsList.classList.add('hidden');
      return;
    }

    try {
      const res = await fetch(`/api/searchGamesName?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      resultsList.innerHTML = '';

      if (!data.results?.length) {
        resultsList.classList.add('hidden');
        return;
      }

      data.results.forEach((game) => {
        const li = document.createElement('li');
        li.textContent = game.name;
        li.className = 'cursor-pointer hover:bg-gray-200 px-2 py-1';
        li.addEventListener('click', () => {
          searchInput.value = game.name;
          hiddenInput.value = game.name;
          resultsList.innerHTML = '';
          resultsList.classList.add('hidden');
        });
        resultsList.appendChild(li);
      });

      resultsList.classList.remove('hidden');
    } catch (err) {
      console.error('Error searching games:', err);
    }
  });

  document.addEventListener('click', (event) => {
    if (!resultsList.contains(event.target) && event.target !== searchInput) {
      resultsList.classList.add('hidden');
    }
  });
});