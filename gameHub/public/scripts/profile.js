document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('kenburns-bg-wrapper');

    fetch('/api/profileBG')
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

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const region = getRegion(lat, lon);

            document.getElementById("location").innerText = region;

            // Send to backend
            try {
                const res = await fetch("/profile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ location: region })
                });

                if (res.ok) {
                    console.log("Region sent successfully");
                } else {
                    console.error("Failed to send region");
                }
            } catch (err) {
                console.error("Error sending location:", err);
            }
        }, showError);
    } else {
        document.getElementById("location").innerText = "Geolocation is not supported by this browser.";
    }
}

function getRegion(lat, lon) {
    if (lat >= 15 && lat <= 72 && lon >= -170 && lon <= -50) {
        return "North America";
    } else if (lat >= -60 && lat <= 15 && lon >= -90 && lon <= -30) {
        return "South America";
    } else if (lat >= 35 && lat <= 70 && lon >= -10 && lon <= 60) {
        return "Europe";
    } else if (lat >= 5 && lat <= 80 && lon >= 60 && lon <= 180) {
        return "Asia";
    } else if (lat >= -50 && lat <= 0 && lon >= 110 && lon <= 180) {
        return "Oceania";
    } else {
        return "Unknown Region";
    }
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById("location").innerText = "User denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById("location").innerText = "Location information is unavailable.";
            break;
        case error.TIMEOUT:
            document.getElementById("location").innerText = "The request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById("location").innerText = "An unknown error occurred.";
            break;
    }
}