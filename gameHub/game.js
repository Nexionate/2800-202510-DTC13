const gameId = '3498'; // Example game ID for "Grand Theft Auto V"
const apiKey = 'f61c15c68f3246a3aeebcfa53cdef84f'; // 

fetch(`https://api.rawg.io/api/games/${gameId}?key=${apiKey}`)
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
    })
    .then(response => response.json())
    .then(data => {
        console.log(111);
        document.getElementById('game-title').textContent = data.name;
        document.getElementById('game-image').src = data.background_image;
        // document.getElementById('game-description').innerHTML = data.description;
    })
    .catch(error => {
        console.log(444);
        console.error('Error fetching game data:', error);
    });