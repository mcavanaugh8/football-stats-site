class UI {
    constructor(allPlayers, allRosters) {
        this.allPlayers = [allPlayers];
        this.allRosters = allRosters;
    }

    addAllEventListeners() {
        const playerSearch = document.getElementById('playerSearch');

        
        document.addEventListener('DOMContentLoaded', () => {
            if (document.querySelector('.player-grid')) {
                const playerGrid = document.querySelector('.player-grid');
    
                playerGrid.addEventListener('click', (e) => {
                    const card = e.target.closest('.player-card');
    
                    if (card) {
                        const playerId = card.getAttribute('data-player-id');
                        const playerName = card.getAttribute('data-player-name');
    
                        console.log(e.target);
                        console.log('Player card clicked:', card);
                        console.log(`Player: ${playerName}`);
    
    
                        const modal = document.getElementById('playerStatsModal-' + playerId);
                        modal.style.display = 'block';
    
                        // Corrected selector for close button
                        const closeButton = modal.querySelector('.modal-content .close');
    
                        // Remove any existing event listeners to avoid duplicates
                        closeButton.removeEventListener('click', closeModal); // Ensure no duplicates
                        closeButton.addEventListener('click', closeModal);
    
                        this.displayPlayerStats(modal);
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
    
                // Function to close the modal
                function closeModal() {
                    const modal = this.closest('.modal'); // Get the modal from the close button context
                    modal.style.display = 'none';
                }
                
                playerSearch.addEventListener('input', e => {
                    console.log(playerSearch.value);
                })
                
            }
        });


    }

    displayPlayerStats(modal) {
        /**
         * stats by year
         * stats by game
         * stats vs specific teams
         */

        modal.style.display = 'block';
        // this.allPlayers.forEach(player => {
        //     player.stats.forEach(item => {
        //         switch (item.category) {
        //             case 'stats':
        //                 for (var i = 0; i < item.rows.length; i++) {
        //                     let game = item.rows[i];
        //                     console.log(current)
        //                 }
        //                 break;
        //         }
        //     })
        // })
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