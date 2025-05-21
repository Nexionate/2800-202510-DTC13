document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.tilt-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = -(y - centerY) / 20;
        const rotateY = (x - centerX) / 20;

        card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
        });

        card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        });
    });

    const wrapper = document.getElementById('kenburns-bg-wrapper');

    fetch('/api/homeBG')
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
    starHTML +=
        '<i class="fas fa-star-half-alt" style="color: gold;"></i>';
    }

    for (let i = 0; i < emptyStars; i++) {
    starHTML += '<i class="far fa-star" style="color: lightgray;"></i>';
    }

    return starHTML;
}