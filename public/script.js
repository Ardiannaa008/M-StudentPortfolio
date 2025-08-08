const form = document.getElementById('portfolio-form');
const feed = document.getElementById('feed');
const universitySections = {};
const searchInput = document.getElementById('searchInput');
const filterToggleBtn = document.getElementById('filter-toggle');
const sidebar = document.getElementById('sidebar');
const body = document.body;


const backdrop = document.createElement('div');
backdrop.className = 'sidebar-backdrop';
document.body.appendChild(backdrop);

function toggleSidebar() {
  const isActive = sidebar.classList.toggle('active');
  body.classList.toggle('sidebar-open', isActive);
  filterToggleBtn.setAttribute('aria-expanded', isActive);
  backdrop.classList.toggle('active', isActive);
}

filterToggleBtn.addEventListener('click', toggleSidebar);
backdrop.addEventListener('click', toggleSidebar);





function escapeHTML(str) {
  if (typeof str !== 'string') return '';
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

function isValidUrl(url) {
  return typeof url === 'string' && url.trim().startsWith('http');
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
  cardData.id = Date.now();

  localStorage.setItem('myPortfolioOwner', cardData.email);

  const savedCard = await saveCard(cardData);
  if (savedCard) {
    addCardToFeed(savedCard);  // add new card immediately to feed
  }
  await loadSavedCards();

  form.reset();
  closeModal();
  feed.style.display = 'block';
  feed.scrollIntoView({ behavior: 'smooth' });
});


// Add one card to feed
function addCardToFeed(data) {
  if (!data || !data.fullName) return; 

  const { fullName, initials, university, program, year, bio, skills, projectTitle, projectDescription, email, linkedin, github, instagram, twitter, id } = data;

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
      <div class="social-links">
        ${isValidUrl(linkedin) ? `<a href="${escapeHTML(linkedin)}" target="_blank" rel="noopener noreferrer" title="LinkedIn"><i class="fab fa-linkedin"></i></a>` : ''}
        ${isValidUrl(github) ? `<a href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer" title="GitHub"><i class="fab fa-github"></i></a>` : ''}
        ${isValidUrl(instagram) ? `<a href="${escapeHTML(instagram)}" target="_blank" rel="noopener noreferrer" title="Instagram"><i class="fab fa-instagram"></i></a>` : ''}
      </div>
    </div>



      <div class="actions">
        <button onclick="likeCard(this)">👍 Like</button>
        <button onclick="commentCard(this)">💬 Comment</button>
      </div>
    </div>
  `;

  universitySections[university].prepend(card);
}

// ✅ Put this outside the function so it's reusable
function isValidUniversityEmail(email) {
  const allowedDomains = [
    "ukim.edu.mk", "ugd.edu.mk", "uklo.edu.mk", "unite.edu.mk", "uist.edu.mk",
    "seeu.edu.mk", "ibu.edu.mk", "fon.edu.mk", "uacs.edu.mk", "eurm.edu.mk",
    "euba.edu.mk", "eust.edu.mk", "mit.edu.mk", "utms.edu.mk", "esra.com.mk",
    "fbe.edu.mk", "eurocollege.edu.mk"
  ];
  const domain = email.split("@")[1]?.toLowerCase();
  return allowedDomains.includes(domain);
}

async function saveCard(cardData) {
  try {
    // ✅ Frontend check
    if (!isValidUniversityEmail(cardData.email)) {
      alert("Only university emails are allowed");
      return;
    }

    const res = await fetch('https://m-studentportfolio-server.onrender.com/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardData)
    });

    const responseData = await res.json(); // ✅ Parse once

    if (!res.ok) {
      alert(responseData.error || "Failed to save card");
      return null;
    }

    console.log("✅ Card saved to server:", responseData);
    return responseData; // ✅ Return parsed response
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

    buildProgramFilters();
  } catch (err) {
    console.error("❌ Error loading cards:", err);
  }
}

const programSearchInput = document.getElementById("program-search");
const programOptionsContainer = document.getElementById("program-options");
let allPrograms = new Set();

// Called once after cards are loaded
function buildProgramFilters() {
  allPrograms.clear();
  const cards = document.querySelectorAll('.profile-card');
  cards.forEach(card => {
    const program = card.querySelector('.title')?.textContent?.trim();
    if (program) allPrograms.add(program);
  });

  renderProgramOptions();
}

function renderProgramOptions(filterText = "") {
  const selected = new Set(
    Array.from(document.querySelectorAll('.program-option.selected')).map(el => el.textContent.trim())
  );

  programOptionsContainer.innerHTML = "";
  Array.from(allPrograms)
    .filter(p => p.toLowerCase().includes(filterText.toLowerCase()))
    .forEach(program => {
      const option = document.createElement("div");
      option.className = "program-option";
      option.textContent = program;

      if (selected.has(program)) {
        option.classList.add("selected");
      }

      option.addEventListener("click", () => {
        option.classList.toggle("selected");
        filterCardsByProgram(); // filter when selection changes
      });

      programOptionsContainer.appendChild(option);
    });
}

// Called on filter click
function filterCardsByProgram() {
  const selectedPrograms = Array.from(document.querySelectorAll('.program-option.selected'))
    .map(el => el.textContent.trim());

  const cards = document.querySelectorAll('.profile-card');

  cards.forEach(card => {
    const program = card.querySelector('.title')?.textContent?.trim();
    if (selectedPrograms.length === 0 || selectedPrograms.includes(program)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Re-render options on search input
programSearchInput.addEventListener("input", (e) => {
  renderProgramOptions(e.target.value);
});



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
window.addEventListener('DOMContentLoaded', 
  
  loadSavedCards);
