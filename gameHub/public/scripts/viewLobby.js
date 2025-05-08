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
          list.innerHTML = "<li>No available lobbies.</li>";
          return;
        }

        data.forEach((lobby) => {
          const li = document.createElement("li");
          li.innerHTML = `
            <strong>${lobby.lobbyName}</strong> (${lobby.gameName}) — 
            ${lobby.user.length} / ${lobby.numPlayers} players
            <br>Tags: ${lobby.tags.join(", ")}
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
                  alert("Failed to join.");
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