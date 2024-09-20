class UI {
    constructor(allPlayers, allRosters) {
        this.allPlayers = [allPlayers];
        this.allRosters = allRosters;

        console.log(allPlayers)
    }

    addAllEventListeners() {
        console.log(this.allPlayers.length)
        const playerSearch = document.getElementById('playerSearch');
        const suggestions = document.getElementById('suggestions');

        playerSearch.addEventListener('input', e => {
            console.log(playerSearch.value);
        })

        document.addEventListener('DOMContentLoaded', () => {
            const playerGrid = document.querySelector('.player-grid');

            playerGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.player-card');
                if (card) {
                    console.log(e.target);
                    console.log('Player card clicked:', card);

                    const playerId = card.getAttribute('data-player-id');
                    console.log(`Player ID: ${playerId}`);
                    // Handle the click event here
                }
            });
        });
    }

}