const form = document.getElementById('portfolio-form');
const feed = document.getElementById('feed');
const universitySections = {};
const searchInput = document.getElementById('searchInput');

// Show modal form
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
  section.innerHTML = `<h2>${name}</h2><div class="card-group"></div>`;
  feed.appendChild(section);
  universitySections[name] = section.querySelector('.card-group');
}

// Handle form submission
form.addEventListener('submit', function (e) {
  e.preventDefault();
  const data = new FormData(form);
  const cardData = Object.fromEntries(data.entries());
  cardData.initials = cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  cardData.id = Date.now(); // Unique ID for deletion

  // Save current user's email to know which card is theirs
  localStorage.setItem('myPortfolioOwner', cardData.email);

  addCardToFeed(cardData);
  saveCard(cardData);

  form.reset();
  closeModal();
  feed.style.display = 'block';
  feed.scrollIntoView({ behavior: 'smooth' });
});

// Display one card
function addCardToFeed(data) {
  const { fullName, initials, university, program, year, bio, skills, projectTitle, projectDescription, email, linkedin, id } = data;

  if (!universitySections[university]) {
    createUniversitySection(university);
  }

  const card = document.createElement('div');
  card.className = 'profile-card';
  card.dataset.id = id; // Attach ID to card element

  card.innerHTML = `
    <div class="card-header">
      <div class="avatar">${initials}</div>
    </div>
    <div class="card-body">
      <h3 class="portfolio-name">${fullName}</h3>
      <p class="title">${program}</p>
      <p class="meta">
        <span>🏫 ${university}</span> &nbsp;|&nbsp;
        <span>📅 ${year}</span>
      </p>
      <p class="bio">${bio}</p>

      ${skills ? `
        <div class="section">
          <h3>Skills</h3>
          <div class="tags">${skills.split(',').map(skill => `<span class="tag">${skill.trim()}</span>`).join(' ')}</div>
        </div>` : ''}

      ${projectTitle ? `
        <div class="section">
          <h3>Project</h3>
          <div class="project">
            <strong>${projectTitle}</strong>
            <p>${projectDescription}</p>
          </div>
        </div>` : ''}

      <div class="section">
        <h3>Contact</h3>
        <p>Email: ${email || 'N/A'}</p>
        ${linkedin ? `<p>LinkedIn: <a href="${linkedin}" target="_blank">${linkedin}</a></p>` : ''}
      </div>

      <div class="actions">
        <button onclick="likeCard(this)">👍 Like</button>
        <button onclick="commentCard(this)">💬 Comment</button>
        ${email === localStorage.getItem('myPortfolioOwner') ? `<button onclick="deleteCard(${id}, this)">🗑️ Delete</button>` : ''}
      </div>
    </div>
  `;

  universitySections[university].prepend(card);
}

// Delete card and remove from localStorage
function deleteCard(cardId, button) {
  const saved = JSON.parse(localStorage.getItem('studentPortfolios')) || [];
  const updated = saved.filter(entry => entry.id !== cardId);
  localStorage.setItem('studentPortfolios', JSON.stringify(updated));

  const card = button.closest('.profile-card');
  card.remove();
}

// Save new card to localStorage
function saveCard(data) {
  const existing = JSON.parse(localStorage.getItem('studentPortfolios')) || [];
  existing.push(data);
  localStorage.setItem('studentPortfolios', JSON.stringify(existing));
}

// Load all cards from localStorage
function loadSavedCards() {
  const saved = JSON.parse(localStorage.getItem('studentPortfolios')) || [];
  saved.forEach(cardData => {
    addCardToFeed(cardData);
  });
}

// Like button handler
function likeCard(button) {
  let count = button.dataset.count ? parseInt(button.dataset.count) : 0;
  count++;
  button.dataset.count = count;
  button.textContent = `👍 Like (${count})`;
}

// Comment button handler
function commentCard(button) {
  const comment = prompt("Leave a comment:");
  if (comment) alert(`You said: ${comment}`);
}

// Search input handler
searchInput.addEventListener('input', function () {
  const searchTerm = this.value.toLowerCase();
  const allCards = document.querySelectorAll('.profile-card');

  allCards.forEach(card => {
    const name = card.querySelector('.portfolio-name')?.textContent.toLowerCase() || '';
    if (name.includes(searchTerm)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
});

// Load cards when page is ready
window.addEventListener('DOMContentLoaded', () => {
  loadSavedCards();
});
