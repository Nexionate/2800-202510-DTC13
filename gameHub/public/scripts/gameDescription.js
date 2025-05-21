document.addEventListener('DOMContentLoaded', () => {
  const body = document.getElementById('page-body');
  const gameId = body?.dataset?.gameId;
  
  fetch(`/api/game/${gameId}`)
    .then((response) => {
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const descriptionHTML = data.description || '';
      const cleanedDescription = descriptionHTML.split('Español')[0];
      document.getElementById('game-title').textContent = data.name;
      document.getElementById('game-image').src = data.background_image;
      document.getElementById('game-description').innerHTML =
        cleanedDescription || 'No description available.';
      document.getElementById('page-body').style.backgroundImage = `url('${data.background_image}')`;
    })
    .catch((error) => {
      console.error('Error fetching game data:', error);
    });
});
