const fetchLobbies = (dataOverride = null) => {
  const render = (data) => {
    const list = document.getElementById("lobby-list");
    list.innerHTML = "";

    if (data.length === 0) {
      list.innerHTML = `<p class="text-center text-white">No lobbies found.</p>`;
      return;
    }

    data.forEach((lobby) => {
      const li = document.createElement("li");
      li.className = "bg-[#0a0e1a] border border-white text-white shadow rounded-lg p-4";
      li.innerHTML = `
        <h2 class="text-xl font-semibold">${lobby.lobbyName}</h2>
        <p><strong>Game:</strong> ${lobby.gameName}</p>
        <p><strong>Players:</strong> ${lobby.user.length} / ${lobby.numPlayers}</p>
        <p><strong>Tags:</strong> ${lobby.tags ? lobby.tags.join(', ') : 'None'}</p>
        <p><strong>Owner:</strong> ${lobby.owner}</p>
      `;

      const joinBtn = document.createElement("button");
      joinBtn.innerText = "Join";
      joinBtn.className = "bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition hover:scale-[1.01] ease-in-out shadow:md";
      joinBtn.onclick = () => {
        fetch(`/joinLobby/${lobby.lobbyId}`, { method: "POST" })
          .then((res) => {
            if (res.ok) {
              alert("Joined lobby!");
              fetchLobbies();
            } else {
              res.text().then((msg) => alert(msg));
            }
          })
          .catch((err) => console.error("Join error:", err));
      };

      li.appendChild(document.createElement("br"));
      li.appendChild(joinBtn);
      list.appendChild(li);
    });
  };

  if (dataOverride) {
    render(dataOverride);
  } else {
    fetch("/lobbies")
      .then(res => res.json())
      .then(render)
      .catch(err => console.error("Error fetching lobbies:", err));
  }
};

  fetchLobbies();

  function applyCombinedFilter() {
  const input = document.getElementById("filter-input").value.trim();
  const select = document.getElementById("tag-filter");
  const selectedTags = Array.from(select.selectedOptions).map(opt => opt.value);

  const params = new URLSearchParams();

  if (input) params.append("search", input);
  if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));

  fetch(`/lobbies?${params.toString()}`)
    .then(res => res.json())
    .then(data => fetchLobbies(data))  
    .catch(err => console.error("Filter error:", err));
}

document.addEventListener('DOMContentLoaded', () => {


    const wrapper = document.getElementById('kenburns-bg-wrapper');

    fetch('/api/viewLobbyBG')
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