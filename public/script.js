// script.js

const form = document.getElementById('portfolio-form');
const feed = document.getElementById('feed');
const universitySections = {};
const searchInput = document.getElementById('searchInput');
const filterToggleBtn = document.getElementById('filter-toggle');
const sidebar = document.getElementById('sidebar');
const body = document.body;
const programSearchInput = document.getElementById('program-search');
const programOptionsContainer = document.getElementById('program-options');
let allPrograms = new Set();

const apiBaseUrl = `${window.location.origin}/api/cards`;

// Sidebar backdrop
const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);

// Sidebar toggle
function toggleSidebar() {
  const isActive = sidebar.classList.toggle('active');
  body.classList.toggle('sidebar-open', isActive);
  filterToggleBtn.setAttribute('aria-expanded', isActive);
  backdrop.classList.toggle('active', isActive);
}
filterToggleBtn.addEventListener('click', (e) => {
  toggleSidebar();
  e.stopPropagation();
});
backdrop.addEventListener('click', () => toggleSidebar());

// Modal
const openFormBtn = document.getElementById('openFormBtn');
const formModal = document.getElementById('formModal');
const closeModalBtn = document.getElementById('closeModalBtn');

openFormBtn.addEventListener('click', () => {
  formModal.style.display = 'block';
});

closeModalBtn.addEventListener('click', () => {
  formModal.style.display = 'none';
});

formModal.addEventListener('click', (e) => {
  if (e.target === formModal) formModal.style.display = 'none';
});

// Helpers
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function isValidUrl(url) {
  return typeof url === 'string' && url.trim().startsWith('http');
}

// University sections
function createUniversitySection(name) {
  const section = document.createElement('div');
  section.className = 'university-section';
  section.innerHTML = `<h2>${escapeHTML(name)}</h2><div class="card-group"></div>`;
  feed.appendChild(section);
  universitySections[name] = section.querySelector('.card-group');
}

// Form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const cardData = Object.fromEntries(data.entries());
  cardData.initials = cardData.fullName.split(' ').map(n => n[0]).join('').toUpperCase();
  cardData.id = Date.now();

  localStorage.setItem('myPortfolioOwner', cardData.email);

  const savedCard = await saveCard(cardData);
  if (savedCard) addCardToFeed(savedCard);

  await loadSavedCards();
  form.reset();
  formModal.style.display = 'none';
  feed.style.display = 'block';
  feed.scrollIntoView({ behavior: 'smooth' });
});

// Add card
function addCardToFeed(data) {
  if (!data || !data.fullName) return;

  const { fullName, initials, university, program, year, bio, skills, projectTitle, projectDescription, email, linkedin, github, instagram, id } = data;

  if (!universitySections[university]) createUniversitySection(university);

  const card = document.createElement('div');
  card.className = 'profile-card';
  card.dataset.id = id;
  card.dataset.university = university;
  card.dataset.year = year;
  card.dataset.program = program;

  // Build card content without inline JS
  card.innerHTML = `
    <div class="card-header">
      <div class="avatar">${escapeHTML(initials)}</div>
    </div>
    <div class="card-body">
      <h3 class="portfolio-name">${escapeHTML(fullName)}</h3>
      <p class="title">${escapeHTML(program)}</p>
      <p class="meta">🏫 ${escapeHTML(university)} &nbsp;|&nbsp; 📅 ${escapeHTML(year)}</p>
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
        <div class="social-links">
          ${isValidUrl(linkedin) ? `<a href="${escapeHTML(linkedin)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-linkedin"></i></a>` : ''}
          ${isValidUrl(github) ? `<a href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-github"></i></a>` : ''}
          ${isValidUrl(instagram) ? `<a href="${escapeHTML(instagram)}" target="_blank" rel="noopener noreferrer"><i class="fab fa-instagram"></i></a>` : ''}
        </div>
      </div>
      <div class="actions">
        <button class="like-btn">👍 Like</button>
        <button class="comment-btn">💬 Comment</button>
      </div>
    </div>
  `;

  universitySections[university].prepend(card);

  // Add event listeners to buttons
  card.querySelector('.like-btn').addEventListener('click', () => likeCard(card.querySelector('.like-btn')));
  card.querySelector('.comment-btn').addEventListener('click', () => commentCard());
}

// Only allow university emails
function isValidUniversityEmail(email) {
  const allowedDomains = [
    'ukim.edu.mk','ugd.edu.mk','uklo.edu.mk','unite.edu.mk','uist.edu.mk',
    'seeu.edu.mk','ibu.edu.mk','fon.edu.mk','uacs.edu.mk','eurm.edu.mk',
    'euba.edu.mk','eust.edu.mk','mit.edu.mk','utms.edu.mk','esra.com.mk',
    'fbe.edu.mk','eurocollege.edu.mk'
  ];
  const domain = email.split('@')[1]?.toLowerCase();
  return allowedDomains.includes(domain);
}

// Save to backend
async function saveCard(cardData) {
  try {
    if (!isValidUniversityEmail(cardData.email)) {
      alert('Only university emails are allowed');
      return null;
    }
    const res = await fetch(apiBaseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData),
    });
    const responseData = await res.json();
    if (!res.ok) throw new Error(responseData.error || 'Failed to save card');
    return responseData;
  } catch {
    alert('Failed to save portfolio. Please try again later.');
    return null;
  }
}

// Load saved cards
async function loadSavedCards() {
  try {
    const res = await fetch(apiBaseUrl);
    if (!res.ok) throw new Error('Failed to fetch cards');
    const cards = await res.json();

    feed.innerHTML = '';
    Object.keys(universitySections).forEach(k => delete universitySections[k]);
    cards.forEach(addCardToFeed);

    buildProgramFilters();
    resetFilters();
  } catch {
    alert('Failed to load portfolios.');
  }
}

// Build program filters
function buildProgramFilters() {
  allPrograms.clear();
  document.querySelectorAll('.profile-card').forEach(card => {
    const program = card.querySelector('.title')?.textContent?.trim();
    if (program) allPrograms.add(program);
  });
  renderProgramOptions();
}

function renderProgramOptions(filterText = '') {
  const selected = new Set(
    Array.from(document.querySelectorAll('.program-option.selected')).map(el => el.textContent.trim())
  );
  programOptionsContainer.innerHTML = '';
  Array.from(allPrograms)
    .filter(p => p.toLowerCase().includes(filterText.toLowerCase()))
    .forEach(program => {
      const option = document.createElement('div');
      option.className = 'program-option';
      option.textContent = program;
      if (selected.has(program)) option.classList.add('selected');
      option.addEventListener('click', () => {
        option.classList.toggle('selected');
        filterCards();
      });
      programOptionsContainer.appendChild(option);
    });
}

// Filters
function resetFilters() {
  document.querySelectorAll('.program-option.selected').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('input[name="filterUniversity"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('input[name="filterYear"]').forEach(cb => cb.checked = false);
  searchInput.value = '';
  programSearchInput.value = '';
  document.querySelectorAll('.profile-card').forEach(card => card.style.display = 'block');
}

function filterCards() {
  const selectedPrograms = Array.from(document.querySelectorAll('.program-option.selected')).map(el => el.textContent.trim());
  const selectedUniversities = Array.from(document.querySelectorAll('input[name="filterUniversity"]:checked')).map(el => el.value);
  const selectedYears = Array.from(document.querySelectorAll('input[name="filterYear"]:checked')).map(el => el.value);
  const searchTerm = searchInput.value.toLowerCase();

  document.querySelectorAll('.profile-card').forEach(card => {
    const program = card.querySelector('.title')?.textContent?.trim();
    const university = card.dataset.university;
    const year = card.dataset.year;
    const name = card.querySelector('.portfolio-name')?.textContent?.toLowerCase() || '';

    const matchesProgram = selectedPrograms.length === 0 || selectedPrograms.includes(program);
    const matchesUniversity = selectedUniversities.length === 0 || selectedUniversities.includes(university);
    const matchesYear = selectedYears.length === 0 || selectedYears.includes(year);
    const matchesSearch = searchTerm === '' || name.includes(searchTerm);

    card.style.display = (matchesProgram && matchesUniversity && matchesYear && matchesSearch) ? 'block' : 'none';
  });
}

// Event listeners for filters
programSearchInput.addEventListener('input', e => renderProgramOptions(e.target.value));
searchInput.addEventListener('input', filterCards);
document.querySelectorAll('input[name="filterUniversity"], input[name="filterYear"]').forEach(cb => {
  cb.addEventListener('change', filterCards);
});

// Like/comment actions
function likeCard(button) {
  let count = button.dataset.count ? parseInt(button.dataset.count) : 0;
  count++;
  button.dataset.count = count;
  button.textContent = `👍 Like (${count})`;
}
function commentCard() {
  const comment = prompt('Leave a comment:');
  if (comment) alert(`You said: ${comment}`);
}

// Load cards on page load
window.addEventListener('DOMContentLoaded', loadSavedCards);
