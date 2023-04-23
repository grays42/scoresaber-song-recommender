const form = document.querySelector('form');
const messagesDiv = document.getElementById('messages');

// Log a message to the browser console and append it to the messages div
function logMessage(message) {
    console.log(message);
    messagesDiv.innerHTML += `<p>${message}</p>`;
  }

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const input = document.querySelector('input');
  const userId = input.value.trim();

  //Fetch player rank
  logMessage("Fetching player details...")

  const response = await fetch(`https://scoresaber.com/api/player/${userId}/basic`)
  const data = await response.json();

  logMessage(`Player: ${data.name}`)
  logMessage(`Rank: ${data.rank}`)


  // Call ScoreSaber API using userId
  const response = await fetch(`https://new.scoresaber.com/api/player/${userId}/scores/top/50`);
  const data = await response.json();


  // Extract top 50 scores from response
  const top50 = data.scores.slice(0, 50);

  // Display top 50 scores on page
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Song</th>
        <th>Mapper</th>
        <th>Difficulty</th>
        <th>PP</th>
      </tr>
    </thead>
    <tbody>
      ${top50.map(score => `
        <tr>
          <td>${score.songName}</td>
          <td>${score.levelAuthorName}</td>
          <td>${score.difficultyRaw}</td>
          <td>${score.pp}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  document.body.appendChild(table);
});