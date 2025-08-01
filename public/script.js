const form = document.getElementById('portfolio-form');
const feed = document.getElementById('feed');
const universitySections = {};
const searchInput = document.getElementById('searchInput');


function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, function (m) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[m];
  });
}

function scrollToForm() {
  document.getElementById('formModal').style.display = 'block';
}

// Close modal
function closeModal() {
  document.getElementById('formModal').style.display = 'none';
}

// Create new university section if it doesn't exist
function createUniversitySection(name) {
  const section = document.createElement('div');
  section.className = 'university-section';
  section.innerHTML = `<h2>${escapeHTML(name)}</h2><div class="card-group"></div>`;
  feed.appendChild(section);
  universitySections[name] = section.querySelector('.card-group');
}

// Handle form submission
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const data = new FormData(form);
  const cardData = Object.fromEntries(data.entries());
  cardData.initials = cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  cardData.id = Date.now(); // Unique ID for deletion

  localStorage.setItem('myPortfolioOwner', cardData.email);

  await saveCard(cardData);
  loadSavedCards();

  form.reset();
  closeModal();
  feed.style.display = 'block';
  feed.scrollIntoView({ behavior: 'smooth' });
});

// Add one card to feed
function addCardToFeed(data) {
  if (!data || !data.fullName) return; 

  const { fullName, initials, university, program, year, bio, skills, projectTitle, projectDescription, email, linkedin, id } = data;

  if (!universitySections[university]) {
    createUniversitySection(university);
  }

  const card = document.createElement('div');
  card.className = 'profile-card';
  card.dataset.id = id;

  card.innerHTML = `
    <div class="card-header">
      <div class="avatar">${escapeHTML(initials)}</div>
    </div>
    <div class="card-body">
      <h3 class="portfolio-name">${escapeHTML(fullName)}</h3>
      <p class="title">${escapeHTML(program)}</p>
      <p class="meta">
        <span>🏫 ${escapeHTML(university)}</span> &nbsp;|&nbsp;
        <span>📅 ${escapeHTML(year)}</span>
      </p>
      <p class="bio">${escapeHTML(bio)}</p>

      ${skills ? `
        <div class="section">
          <h3>Skills</h3>
          <div class="tags">${skills.split(',').map(skill => `<span class="tag">${skill.trim()}</span>`).join(' ')}</div>
        </div>` : ''}

      ${projectTitle ? `
        <div class="section">
          <h3>Project</h3>
          <div class="project">
            <strong>${escapeHTML(projectTitle)}</strong>
            <p>${escapeHTML(projectDescription)}</p>
          </div>
        </div>` : ''}

      <div class="section">
        <h3>Contact</h3>
        <p>Email: ${escapeHTML(email) || 'N/A'}</p>
        ${linkedin ? `<p>LinkedIn: <a href="${escapeHTML(linkedin)}" target="_blank" rel="noopener noreferrer">${escapeHTML(linkedin)}</a></p>` : ''}
      </div>

      <div class="actions">
        <button onclick="likeCard(this)">👍 Like</button>
        <button onclick="commentCard(this)">💬 Comment</button>
      </div>
    </div>
  `;

  universitySections[university].prepend(card);
}

// Save card to backend
async function saveCard(cardData) {
  try {
    const res = await fetch('https://m-studentportfolio-server.onrender.com/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });

    if (!res.ok) throw new Error('Failed to save card');

    const savedCard = await res.json();
    console.log("✅ Card saved to server:", savedCard);
    return savedCard; // if you want to use it later
  } catch (err) {
    console.error("❌ Error saving card:", err);
  }
}


// Load all cards from backend
async function loadSavedCards() {
  try {
    const res = await fetch('https://m-studentportfolio-server.onrender.com/api/cards');
    if (!res.ok) throw new Error('Failed to fetch cards');
    const cards = await res.json();

    // Clear previous cards and sections before adding new ones
    feed.innerHTML = '';
    for (const key in universitySections) {
      delete universitySections[key];
    }

    cards.forEach(addCardToFeed);
  } catch (err) {
    console.error("❌ Error loading cards:", err);
  }
}


// Like button
function likeCard(button) {
  let count = button.dataset.count ? parseInt(button.dataset.count) : 0;
  count++;
  button.dataset.count = count;
  button.textContent = `👍 Like (${count})`;
}

// Comment button
function commentCard(button) {
  const comment = prompt("Leave a comment:");
  if (comment) alert(`You said: ${comment}`);
}

// Search
searchInput.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  const allCards = document.querySelectorAll('.profile-card');

  allCards.forEach(card => {
    const name = card.querySelector('.portfolio-name')?.textContent.toLowerCase() || '';
    card.style.display = name.includes(searchTerm) ? 'block' : 'none';
  });
});

// Load all saved cards when page loads
window.addEventListener('DOMContentLoaded', loadSavedCards);
