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

            if (document.querySelector('.team-name')) {

                let cells = document.querySelectorAll('.team-name');
                cells.forEach(cell => {
                    this.formatTeamCells(cell)
                })
            }

            if (document.querySelector('.hamburger')) {
                const hamburger = document.querySelector('.hamburger');
                const navMenu = document.querySelector('header ul');
    
                hamburger.addEventListener('click', () => {
                    navMenu.classList.toggle('show'); 
                });
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

    formatTeamCells(playerCard) {
        switch (playerCard.textContent) {
            case 'JAX':
            case 'Jacksonville Jaguars':
                playerCard.style.backgroundColor = '#45818e';
                playerCard.style.color = '#f1c232';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NYJ':
            case 'New York Jets':
                playerCard.style.backgroundColor = '#38761d';
                playerCard.style.color = '#fff';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'SF':
            case 'San Francisco 49ers':
                playerCard.style.backgroundColor = '#ff0000';
                playerCard.style.color = '#ffd966';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'ATL':
            case 'Atlanta Falcons':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#a71930';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CIN':
            case 'Cincinnati Bengals':
                playerCard.style.backgroundColor = '#ff6e07';
                playerCard.style.color = '#000000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'MIA':
            case 'Miami Dolphins':
                playerCard.style.backgroundColor = '#00ffff';
                playerCard.style.color = '#ff6e07';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'DET':
            case 'Detroit Lions':
                playerCard.style.backgroundColor = '#3d85c6';
                playerCard.style.color = '#efefef';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CAR':
            case 'Carolina Panthers':
                playerCard.style.backgroundColor = '#23b8ff';
                playerCard.style.color = '#000000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'DEN':
            case 'Denver Broncos':
                playerCard.style.backgroundColor = '#ff8b07';
                playerCard.style.color = '#002b62';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'DAL':
            case 'Dallas Cowboys':
                playerCard.style.backgroundColor = '#FFF';
                playerCard.style.color = '#042f6a';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NYG':
            case 'New York Giants':
                playerCard.style.backgroundColor = '#1155cc';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'PHI':
            case 'Philadelphia Eagles':
                playerCard.style.backgroundColor = '#274e13';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'LAC':
            case 'Los Angeles Chargers':
                playerCard.style.backgroundColor = '#11a1ff';
                playerCard.style.color = '#f1c232';
                playerCard.style.fontWeight = 'bolder';
                playerCard.style.fontSize = '0.9rem';
                break;
            case 'MIN':
            case 'Minnesota Vikings':
                playerCard.style.backgroundColor = '#351c75';
                playerCard.style.color = '#ffff00';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NE':
            case 'New England Patriots':
                playerCard.style.backgroundColor = '#000d4d';
                playerCard.style.color = '#ff0000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'ARI':
            case 'Arizona Cardinals':
                playerCard.style.backgroundColor = '#cc0000';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'LV':
            case 'Las Vegas Raiders':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#d9d9d9';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'WAS':
            case 'Washington Commanders':
            case 'Washington Redskins':
                playerCard.style.backgroundColor = '#990000';
                playerCard.style.color = '#f1c232';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CHI':
            case 'Chicago Bears':
                playerCard.style.backgroundColor = '#072253';
                playerCard.style.color = '#ff6e07';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'IND':
            case 'Indianapolis Colts':
                playerCard.style.backgroundColor = '#001685';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'TEN':
            case 'Tennessee Titans':
                playerCard.style.backgroundColor = '#6fa8dc';
                playerCard.style.color = '#073763';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'PIT':
            case 'Pittsburgh Steelers':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#ffff00';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CLE':
            case 'Cleveland Browns':
                playerCard.style.backgroundColor = '#6c3803';
                playerCard.style.color = '#ff6e07';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'BAL':
            case 'Baltimore Ravens':
                playerCard.style.backgroundColor = '#2d1764';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NO':
            case 'New Orleans Saints':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#d5b11b';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'GB':
            case 'Green Bay Packers':
                playerCard.style.backgroundColor = '#274e13';
                playerCard.style.color = '#ffff00';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'BUF':
            case 'Buffalo Bills':
                playerCard.style.backgroundColor = '#1155cc';
                playerCard.style.color = '#ff0000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'HOU':
            case 'Houston Texans':
                playerCard.style.backgroundColor = 'rgba(4,47,106,1)';
                playerCard.style.color = '#ff0000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'KC':
            case 'Kansas City Chiefs':
                playerCard.style.backgroundColor = '#ff0000';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'LAR':
            case 'Los Angeles Rams':
                playerCard.style.backgroundColor = 'rgba(7,55,99,1)';
                playerCard.style.color = '#d5b11b';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'TB':
            case 'Tampa Bay Buccaneers':
                playerCard.style.backgroundColor = 'rgba(204,65,37,1)';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'SEA':
            case 'Seattle Seahawks':
                playerCard.style.backgroundColor = 'rgba(0,34,68,1)';
                playerCard.style.color = 'rgba(105,190,40,1)';
                playerCard.style.fontWeight = 'bolder';
                break;
        }

        switch (playerCard.dataset.team) {
            case 'JAX':
            case 'Jacksonville Jaguars':
                playerCard.style.backgroundColor = '#45818e';
                playerCard.style.color = '#f1c232';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NYJ':
            case 'New York Jets':
                playerCard.style.backgroundColor = '#38761d';
                playerCard.style.color = '#fff';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'SF':
            case 'San Francisco 49ers':
                playerCard.style.backgroundColor = '#ff0000';
                playerCard.style.color = '#ffd966';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'ATL':
            case 'Atlanta Falcons':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#a71930';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CIN':
            case 'Cincinnati Bengals':
                playerCard.style.backgroundColor = '#ff6e07';
                playerCard.style.color = '#000000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'MIA':
            case 'Miami Dolphins':
                playerCard.style.backgroundColor = '#00ffff';
                playerCard.style.color = '#ff6e07';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'DET':
            case 'Detroit Lions':
                playerCard.style.backgroundColor = '#3d85c6';
                playerCard.style.color = '#efefef';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CAR':
            case 'Carolina Panthers':
                playerCard.style.backgroundColor = '#23b8ff';
                playerCard.style.color = '#000000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'DEN':
            case 'Denver Broncos':
                playerCard.style.backgroundColor = '#ff8b07';
                playerCard.style.color = '#002b62';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'DAL':
            case 'Dallas Cowboys':
                playerCard.style.backgroundColor = '#FFF';
                playerCard.style.color = '#042f6a';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NYG':
            case 'New York Giants':
                playerCard.style.backgroundColor = '#1155cc';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'PHI':
            case 'Philadelphia Eagles':
                playerCard.style.backgroundColor = '#274e13';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'LAC':
            case 'Los Angeles Chargers':
                playerCard.style.backgroundColor = '#11a1ff';
                playerCard.style.color = '#f1c232';
                playerCard.style.fontWeight = 'bolder';
                playerCard.style.fontSize = '0.9rem';
                break;
            case 'MIN':
            case 'Minnesota Vikings':
                playerCard.style.backgroundColor = '#351c75';
                playerCard.style.color = '#ffff00';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NE':
            case 'New England Patriots':
                playerCard.style.backgroundColor = '#000d4d';
                playerCard.style.color = '#ff0000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'ARI':
            case 'Arizona Cardinals':
                playerCard.style.backgroundColor = '#cc0000';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'LV':
            case 'Las Vegas Raiders':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#d9d9d9';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'WAS':
            case 'Washington Commanders':
            case 'Washington Redskins':
                playerCard.style.backgroundColor = '#990000';
                playerCard.style.color = '#f1c232';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CHI':
            case 'Chicago Bears':
                playerCard.style.backgroundColor = '#072253';
                playerCard.style.color = '#ff6e07';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'IND':
            case 'Indianapolis Colts':
                playerCard.style.backgroundColor = '#001685';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'TEN':
            case 'Tennessee Titans':
                playerCard.style.backgroundColor = '#6fa8dc';
                playerCard.style.color = '#073763';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'PIT':
            case 'Pittsburgh Steelers':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#ffff00';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'CLE':
            case 'Cleveland Browns':
                playerCard.style.backgroundColor = '#6c3803';
                playerCard.style.color = '#ff6e07';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'BAL':
            case 'Baltimore Ravens':
                playerCard.style.backgroundColor = '#2d1764';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'NO':
            case 'New Orleans Saints':
                playerCard.style.backgroundColor = '#000000';
                playerCard.style.color = '#d5b11b';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'GB':
            case 'Green Bay Packers':
                playerCard.style.backgroundColor = '#274e13';
                playerCard.style.color = '#ffff00';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'BUF':
            case 'Buffalo Bills':
                playerCard.style.backgroundColor = '#1155cc';
                playerCard.style.color = '#ff0000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'HOU':
            case 'Houston Texans':
                playerCard.style.backgroundColor = 'rgba(4,47,106,1)';
                playerCard.style.color = '#ff0000';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'KC':
            case 'Kansas City Chiefs':
                playerCard.style.backgroundColor = '#ff0000';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'LAR':
            case 'Los Angeles Rams':
                playerCard.style.backgroundColor = 'rgba(7,55,99,1)';
                playerCard.style.color = '#d5b11b';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'TB':
            case 'Tampa Bay Buccaneers':
                playerCard.style.backgroundColor = 'rgba(204,65,37,1)';
                playerCard.style.color = '#FFF';
                playerCard.style.fontWeight = 'bolder';
                break;
            case 'SEA':
            case 'Seattle Seahawks':
                playerCard.style.backgroundColor = 'rgba(0,34,68,1)';
                playerCard.style.color = 'rgba(105,190,40,1)';
                playerCard.style.fontWeight = 'bolder';
                break;
        }
    }

}