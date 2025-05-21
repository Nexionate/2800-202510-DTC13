document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/activeLobbies')
    .then(res => res.json())
    .then(lobbies => {
      const list = document.getElementById('lobby-list');

      if (!lobbies.length) {
        list.innerHTML = '<p class="text-center text-white">No active lobbies found.</p>';
        return;
      }

      const currentUsername = window.currentUsername || ''; // This must be set in the EJS template

      lobbies.forEach(lobby => {
        const li = document.createElement('li');
        li.className = "bg-[#0a0e1a] border border-white text-white shadow rounded-lg p-4";

        const playerListHTML = lobby.usersDetailed.map(player => {
          if (player.username === currentUsername) {
            return `
              <li class="ml-4">
                👤 <input 
                  type="text" 
                  id="editTagInput" 
                  value="${player.displayName}" 
                  class="text-white px-1 rounded"
                />
                <button 
                  onclick="saveTag()" 
                  class="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >Edit Lobby Tag</button>
              </li>
            `;
          } else {
            return `
              <li class="ml-4">
                👤 ${player.displayName} (${player.username}) 
                <span class="text-sm text-gray-400">– ${player.userRegion || 'Region unknown'}</span>
              </li>
            `;
          }
        }).join('');

        li.innerHTML = `
          <h2 class="text-xl font-semibold">${lobby.lobbyName}</h2>
          <p><strong>Game:</strong> ${lobby.gameName}</p>
          <p><strong>Players:</strong> ${lobby.user.length} / ${lobby.numPlayers}</p>
          <p><strong>Tags:</strong> ${lobby.tags ? lobby.tags.join(', ') : 'None'}</p>
          <div class="mt-2">
            <p class="font-semibold">Players in this lobby:</p>
            <ul class="list-disc list-inside">${playerListHTML}</ul>
          </div>
          <button 
            onclick="leaveLobby('${lobby.lobbyId}')" 
            class="mt-4 bg-red-500 hover:bg-red-400 text-white px-3 py-1 rounded"
          >
            Leave Lobby
          </button>
        `;

        list.appendChild(li);
      });
    })
    .catch(err => {
      console.error('Error loading active lobbies:', err);
      document.getElementById('lobby-list').innerHTML = '<p class="text-center text-red-500">Failed to load lobbies.</p>';
    });


    const wrapper = document.getElementById('kenburns-bg-wrapper');

    fetch('/api/activeLobbyBG')
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

    function saveTag() {
        const newTag = document.getElementById("editTagInput").value;

    fetch('/editDisplayName', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `displayName=${encodeURIComponent(newTag)}`
    })
        .then(res => {
        if (!res.ok) throw new Error('Failed to save');
        return res.text();
        })
        .then(() => {
        window.location.reload();
        })
        .catch(err => {
        console.error('Error saving tag:', err);
        alert('Failed to save tag.');
        });
    }
});


function leaveLobby(lobbyId) {
    fetch(`/leaveLobby/${lobbyId}`, {
    method: "POST"
    })
    .then(res => {
        if (!res.ok) throw new Error("Failed to leave");
        return res.text();
    })
    .then(() => {
        window.location.reload();
    })
    .catch(err => {
        console.error("Error leaving lobby:", err);
        alert("Failed to leave the lobby.");
    });
}

