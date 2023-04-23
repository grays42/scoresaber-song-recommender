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

  const basic_response = await fetch(`https://scoresaber.com/api/player/${userId}/basic`)
  const basic_data = await basic_response.json();

  logMessage(`Player: ${data.name}`)
  logMessage(`Rank: ${data.rank}`)
}
