
// Get user ID from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('playerId');
const competitorsAhead = parseInt(urlParams.get('competitorsAhead') || 10); // Default to 10 if not specified
const useCorsRedirect_val = Boolean(urlParams.get('useCorsRedirect'))

function useCorsRedirect() { return useCorsRedirect_val }


const messagesDiv = document.getElementById('messages');
// Log a message to the browser console and append it to the messages div
function logMessage(message, type) {
    const messagesDiv = document.getElementById('messages');
    const messageClass = type === 'data' ? 'data-response' : 'log-message';
    messagesDiv.innerHTML += `<p class="${messageClass}">${message}</p>`;
    console.log(message)
}

async function fetchData(url) {
    if (useCorsRedirect()) { url = "https://cors-anywhere.herokuapp.com/" + url }
    const response = await fetch(url)
    //console.log(response)
    const data = await response.json();

    return data;
}

async function fetchAllScores(playerId, stopFetchingAtZeroPP) {
    let scores = [];
    let page = 1;
    let done = false;

    while (!done) {
        console.log(`Fetching page ${page}...`)
        const data = await fetchData(`https://scoresaber.com/api/player/${playerId}/scores?sort=top&limit=50&page=${page}`);

        if (stopFetchingAtZeroPP) {
            data.playerScores = data.playerScores.filter(score => score.score.pp > 0);
        }

        scores = [...scores, ...data.playerScores];
        page += 1;
        if (data.playerScores.length == 0) {
            return scores;
        }
    }
}

// Given a number of players to find ahead of the player and their rank, get their user IDs
async function getUsersAhead(numPlayersAhead, rank) {

    const page = Math.ceil(rank / 50);
    const nextPage = page - 1;
    const response = await fetchData(`https://scoresaber.com/api/players?page=${page}`);
    const nextResponse = nextPage >= 0 ? await fetchData(`https://scoresaber.com/api/players?page=${nextPage}`) : null;
    const players = nextPage >= 0 ? [...response.players, ...nextResponse.players] : response.players;
    const filteredPlayers = players.filter(player => player.rank >= rank - numPlayersAhead && player.rank < rank).slice(0, numPlayersAhead);
    const returnVals = filteredPlayers
        .sort((a, b) => b.rank - a.rank) // Sort by rank in descending order
        .map(player => {
            return {
                id: player.id,
                name: player.name,
                rank: player.rank
            }
        });
    return returnVals;
}

async function init() {

    logMessage("Fetching player details...", 'log')


    const basicPlayerData = await fetchData(`https://scoresaber.com/api/player/${userId}/basic`)
    console.log(basicPlayerData)

    logMessage(`Player: ${basicPlayerData.name}`, 'data');
    logMessage(`Rank: ${basicPlayerData.rank}`, 'data');


    logMessage(`Fetching ${competitorsAhead} competitors ahead of the player on the global rankings...`, 'log');
    competitorsAheadData = await getUsersAhead(competitorsAhead, basicPlayerData.rank)
    console.log(competitorsAheadData)
    competitorsAheadData.forEach(player => logMessage(`#${player.rank}: ${player.name}`, 'data'));

    let allCompetitorScores = [];

    logMessage(`Fetching scores for competitors...`, 'log');
    for (let i = 0; i < competitorsAheadData.length; i++) {
        const competitorId = competitorsAheadData[i].id;
        const competitorName = competitorsAheadData[i].name;

        const competitorScores = await fetchAllScores(competitorId, true);

        competitorScores.forEach(competitorScore => {
            competitorScore.competitorID = competitorId;
            competitorScore.competitorName = competitorName;
        });

        console.log(competitorScores)
        logMessage(`${competitorName}: ${competitorScores.length} scores retrieved.`, 'data')

        allCompetitorScores = [...allCompetitorScores, ...competitorScores];
    }

    allCompetitorScores.sort((score1, score2) => score2.score.pp - score1.score.pp);
    console.log("allCompetitorScores:")
    console.log(allCompetitorScores)

    logMessage(`Fetching your scores...`, 'log')
    let playerScores = await fetchAllScores(userId, true)
    console.log(playerScores)

    // Summarize top 10 scores
    for (let i = 0; i < 10 && i < playerScores.length; i++) {
        const score = playerScores[i].score;
        const leaderboard = playerScores[i].leaderboard;
        const songName = leaderboard.songName;
        const songAuthorName = leaderboard.songAuthorName;
        const difficulty = leaderboard.difficulty.difficulty;
        const pp = score.pp.toFixed(2);
        logMessage(`#${i + 1}: ${songName} - ${songAuthorName} [${difficulty}]: ${pp}pp`, 'data');
    }

    // Calculate "comfort zone" of star ratings
    const stars = [];
    playerScores.forEach(score => {
        if (score.score.pp > 0) {
            stars.push(score.leaderboard.stars);
        }
    });

    stars.sort((star1, star2) => star1 - star2);
    const numStars = stars.length;
    const twentyPercentileIndex = Math.floor(numStars * 0.2);
    const eightyPercentileIndex = Math.floor(numStars * 0.8);
    const comfortZoneMin = stars[twentyPercentileIndex];
    const comfortZoneMax = stars[eightyPercentileIndex];

    logMessage(`Comfort zone of star ratings for your ranking scores: ${comfortZoneMin} - ${comfortZoneMax}`, 'log');

    // Remove songs outside of comfort zone and songs where the player has a better score
    const filteredScores = allCompetitorScores.filter(competitorScore => {
        const leaderboard = competitorScore.leaderboard
        //console.log(`Evaluating song: ${competitorScore.leaderboard.songName}`)
        const isPlayerScore = playerScores.some(playerScore => playerScore.leaderboard.songHash === leaderboard.songHash);
        //console.log(`isPlayerScore: ${isPlayerScore}`)
        if (isPlayerScore && competitorScore.score && competitorScore.score.baseScore < playerScores.find(playerScore => playerScore.leaderboard.songHash === leaderboard.songHash).score.baseScore) {
            return false;
        }
        return true;
    });

    logMessage(`Filtered scores based on comfort zone and player scores: ${filteredScores.length}`, 'log');
    console.log(filteredScores);

    // Recommend songs based on filteredScores
    const recommendedSongs = [];
    filteredScores.forEach(competitorScore => {
        const leaderboard = competitorScore.leaderboard;
        recommendedSongs.push({
            songName: leaderboard.songName,
            difficulty: leaderboard.difficulty.difficultyRaw.split("_")[1],
            songArtist: leaderboard.songAuthorName,
            mapper: leaderboard.levelAuthorName,
            starRating: leaderboard.stars,
            pp: competitorScore.score.pp,
            ppPlayerName: competitorScore.competitorName
        });
    });

    // Sort recommended songs by descending pp
    recommendedSongs.sort((song1, song2) => song2.pp - song1.pp);

    // Get references to DOM elements
    const slider = document.getElementById('star-rating-slider');
    const tableBody = document.getElementById('recommended-songs-tbody');
    document.getElementById('slider-container').removeAttribute('style');
    document.getElementById('resultContainer').removeAttribute('style');

    // Add event listener to slider
    slider.addEventListener('change', () => {
        const sliderValue = parseInt(slider.value);
        const filteredSongs = recommendedSongs.filter(song => song.starRating <= sliderValue);
        updateTable(filteredSongs);
    });

    // Function to update the table with new data
    function updateTable(songs) {
        let tableHtml = '';

        for (let i = 0; i < songs.length && i < 10; i++) {
            const song = songs[i];
            const rowHtml = `<tr>
                      <td>${song.songName}</td>
                      <td>${song.songArtist}</td>
                      <td>${song.mapper}</td>
                      <td>${song.difficulty}</td>
                      <td>${song.starRating}</td>
                      <td>${song.pp.toFixed(2)}</td>
                      <td>${song.ppPlayerName}</td>
                    </tr>`;
            tableHtml += rowHtml;
        }

        tableBody.innerHTML = tableHtml;
    }

    // Call the updateTable function initially to show all recommended songs
    updateTable(recommendedSongs);

};

init();
