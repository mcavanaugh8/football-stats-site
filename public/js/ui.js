class UI {
    constructor(allPlayers, allRosters) {
        this.allPlayers = [allPlayers];
        this.allRosters = allRosters;
    }

    addAllEventListeners() {
        const playerSearch = document.getElementById('playerSearch');


        document.addEventListener('DOMContentLoaded', () => {
            const playerGrid = document.querySelector('.player-grid');

            playerGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.player-card');
                if (card) {
                    this.displayPlayerStats(card);
                    console.log(e.target);
                    console.log('Player card clicked:', card);

                    const playerId = card.getAttribute('data-player-id');
                    const playerName = card.getAttribute('data-player-name');

                    console.log(`Player ID: ${playerName}`);

                }
            });

            const positionButtons = document.querySelectorAll('.position-button');

            positionButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const position = e.target.getAttribute('data-position');

                    if (!e.target.classList.contains('clicked')) {
                        e.target.classList.add('clicked');
                    } else {
                        e.target.classList.remove('clicked')
                    }

                    this.filterPlayerCardsByPosition();
                });
            });
        });

        playerSearch.addEventListener('input', e => {
            console.log(playerSearch.value);
        })

    }

    displayPlayerStats() {
        /**
         * stats by year
         * stats by game
         * stats vs specific teams
         */
    }

    filterPlayerCardsByPosition(position) {
        let filterBy = [];

        document.querySelectorAll('.position-button').forEach(button => {
            if (button.classList.contains('clicked')) {
                const pos = button.getAttribute('data-position');
                filterBy.push(pos)
            }
        })

        console.log(`Filtering players by positions: ${filterBy.join(', ')}`);

        document.querySelectorAll('.player-card').forEach(card => {
            const pos = card.getAttribute('data-player-position');
            if (filterBy.includes(pos)) {
                card.style.display = 'block';
                // console.log(pos, filterBy);
            } else {
                card.style.display = 'none';
            }
        })
    }

}