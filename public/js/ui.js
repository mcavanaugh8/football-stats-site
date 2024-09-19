class UI {
    constructor() {
        this.allPlayerNames = [];
        this.allPlayers = [];
        this.allTeams = [];
    }

    addAllEventListeners() {
        const playerSearch = document.getElementById('playerSearch');
        const suggestions = document.getElementById('suggestions');

        playerSearch.addEventListener('input', e => {
            console.log(playerSearch.value);
        })

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target !== playerSearch && e.target !== suggestions) {
                suggestions.innerHTML = '';
            }
        });
    }    

}