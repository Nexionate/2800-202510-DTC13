const fetchLobbies = () => {
    fetch("/lobbies")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch lobbies");
        return res.json();
      })
      .then((data) => {
        const list = document.getElementById("lobby-list");
        list.innerHTML = "";
        
        if (data.length === 0) {
          list.innerHTML = `<p class="text-center text-gray-500">No lobbies found.</p>`;
          return;
        }

        data.forEach((lobby) => {
          const li = document.createElement("li");
          li.className = "bg-white shadow rounded-lg p-4";
          li.innerHTML = `
            <h2 class="text-xl font-semibold">${lobby.lobbyName}</h2>
            <p><strong>Game:</strong> ${lobby.gameName}</p>
            <p><strong>Players:</strong> ${lobby.user.length} / ${lobby.numPlayers}</p>
            <p><strong>Tags:</strong> ${lobby.tags ? lobby.tags.join(', ') : 'None'}</p>
            <p><strong>Owner:</strong> ${lobby.owner}</p>
          `;

          const joinBtn = document.createElement("button");
          joinBtn.innerText = "Join";
          joinBtn.onclick = () => {
            fetch(`/joinLobby/${lobby.lobbyId}`, { method: "POST" })
              .then((res) => {
                if (res.ok) {
                  alert("Joined lobby!");
                  fetchLobbies();
                } else {
                  alert("You already in a lobby");
                }
              })
              .catch((err) => console.error("Join error:", err));
          };

          li.appendChild(document.createElement("br"));
          li.appendChild(joinBtn);
          list.appendChild(li);
        });
      })
      .catch((err) => {
        console.error("Error fetching lobbies:", err);
      });
  };

  fetchLobbies();