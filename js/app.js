
// Storage keys for local persistence
const STORAGE_KEYS = {
  favourites: 'nova-game-favourites',
  preferences: 'nova-preferences',
};

// Hero carousel slides
const heroSlides = [
  {
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1086940/header.jpg',
    alt: "Official Baldur's Gate 3 store artwork",
    eyebrow: 'Gaming Portal',
    headline: "Baldur's Gate 3",
    text: 'Shape a party, make consequential choices, and explore an expansive fantasy role-playing adventure.',
  },
  {
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1551360/header.jpg',
    alt: 'Official Forza Horizon 5 store artwork',
    eyebrow: 'Open-World Racing',
    headline: 'Forza Horizon 5',
    text: 'Race and roam across a festival-scale open world, with events for every kind of driving mood.',
  },
  {
    image: 'https://cdn.akamai.steamstatic.com/steam/apps/1091500/header.jpg',
    alt: 'Official Cyberpunk 2077 store artwork',
    eyebrow: 'Featured RPG',
    headline: 'Cyberpunk 2077',
    text: 'Enter Night City for a character-driven science-fiction story shaped by your choices.',
  },
];

// Application state
const state = {
  experiences: [],
  searchTerm: '',
  category: 'All',
  location: 'All Locations',
  sort: 'Recommended',
  featured: 'All',
  heroIndex: 0,
};

const favouritesSet = new Set();
let heroSlideTimer = null;

// DOM Element References
const elements = {
  header: document.getElementById('siteHeader'),
  searchInput: document.getElementById('searchInput'),
  searchButton: document.getElementById('searchButton'),
  resetSearchButton: document.getElementById('resetSearchButton'),
  categoryFilter: document.getElementById('categoryFilter'),
  locationFilter: document.getElementById('locationFilter'),
  sortFilter: document.getElementById('sortFilter'),
  featuredFilter: document.getElementById('featuredFilter'),
  clearFiltersButton: document.getElementById('clearFiltersButton'),
  categoryTabs: document.getElementById('categoryTabs'),
  resultsContainer: document.getElementById('resultsContainer'),
  resultsCount: document.getElementById('resultsCount'),
  favouritesContainer: document.getElementById('favouritesContainer'),
  navFavBadge: document.getElementById('navFavBadge'),
  mobileFavBadge: document.getElementById('mobileFavBadge'),
  modal: document.getElementById('experienceModal'),
  modalContent: document.getElementById('modalContent'),
  modalClose: document.querySelector('.modal-close'),
  modalHeaderFavBtn: document.getElementById('modalHeaderFavBtn'),
  contactForm: document.getElementById('contactForm'),
  formSuccessState: document.getElementById('formSuccessState'),
  resetFormButton: document.getElementById('resetFormButton'),
  navToggle: document.querySelector('.nav-toggle'),
  mobileMenu: document.querySelector('.mobile-menu'),
  heroFrame: document.getElementById('heroFrame'),
  heroBgImage: document.getElementById('heroMainImage'),
  heroHeadline: document.querySelector('.hero-headline'),
  heroEyebrow: document.querySelector('.hero-eyebrow'),
  heroLeadText: document.querySelector('.hero-lead-text'),
  heroIndicators: document.getElementById('heroIndicators'),
  recTrack: document.getElementById('recommendedTrack'),
  recScrollPrev: document.getElementById('recScrollPrev'),
  recScrollNext: document.getElementById('recScrollNext'),
};

// Initialize Application when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  bindEvents();
  loadFavourites();
  loadPreferences();
  loadExperiences();
  startHeroAutoSlide();
  initContactVideo();
  initActiveNav();
}

/* Event Listeners & Binding */
function bindEvents() {
  // Search input
  elements.searchInput?.addEventListener('input', (e) => {
    state.searchTerm = e.target.value.trim();
    renderExperiences();
    savePreferences();
  });

  // Find Game button -> scroll to explore and search
  elements.searchButton?.addEventListener('click', () => {
    const target = document.getElementById('explore');
    target?.scrollIntoView({ behavior: 'smooth' });
    renderExperiences();
  });

  elements.resetSearchButton?.addEventListener('click', () => {
    state.searchTerm = '';
    if (elements.searchInput) elements.searchInput.value = '';
    renderExperiences();
    savePreferences();
  });

  // Category pill tabs
  elements.categoryTabs?.addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-pill-tab');
    if (!tab) return;
    const cat = tab.dataset.cat;
    state.category = cat;
    if (elements.categoryFilter) elements.categoryFilter.value = cat;
    syncCategoryTabs(cat);
    renderExperiences();
    savePreferences();
  });

  // Filters
  elements.categoryFilter?.addEventListener('change', (e) => {
    state.category = e.target.value;
    syncCategoryTabs(state.category);
    renderExperiences();
    savePreferences();
  });

  elements.locationFilter?.addEventListener('change', (e) => {
    state.location = e.target.value;
    renderExperiences();
    savePreferences();
  });

  elements.sortFilter?.addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderExperiences();
    savePreferences();
  });

  elements.featuredFilter?.addEventListener('change', (e) => {
    state.featured = e.target.value;
    renderExperiences();
    savePreferences();
  });

  elements.clearFiltersButton?.addEventListener('click', resetFilters);

  // Mobile menu toggle
  elements.navToggle?.addEventListener('click', () => {
    const isOpen = elements.mobileMenu?.classList.toggle('is-open');
    elements.navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  elements.mobileMenu?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      elements.mobileMenu.classList.remove('is-open');
      elements.navToggle?.setAttribute('aria-expanded', 'false');
    });
  });

  // Recommended carousel scroll buttons
  elements.recScrollPrev?.addEventListener('click', () => {
    elements.recTrack?.scrollBy({ left: -340, behavior: 'smooth' });
  });

  elements.recScrollNext?.addEventListener('click', () => {
    elements.recTrack?.scrollBy({ left: 340, behavior: 'smooth' });
  });

  // Hero carousel indicator dots
  elements.heroIndicators?.addEventListener('click', (e) => {
    const dot = e.target.closest('.hero-indicator-dot');
    if (!dot) return;
    const slideIdx = Number(dot.dataset.slide);
    changeHeroSlide(slideIdx);
    startHeroAutoSlide();
  });

  elements.heroFrame?.addEventListener('mouseenter', stopHeroAutoSlide);
  elements.heroFrame?.addEventListener('mouseleave', startHeroAutoSlide);

  // Card click delegation for Details button and Favourite button
  document.addEventListener('click', (e) => {
    // Open details modal
    const detailsBtn = e.target.closest('.details-btn');
    if (detailsBtn) {
      const id = Number(detailsBtn.dataset.id);
      openExperienceModal(id);
      return;
    }

    // Toggle favourite
    const favBtn = e.target.closest('.favourite-btn');
    if (favBtn) {
      const id = Number(favBtn.dataset.id);
      toggleFavourite(id);
      return;
    }

    // Close modal via backdrop or close button
    if (e.target.matches('[data-close-modal="true"]') || e.target.closest('[data-close-modal="true"]')) {
      closeExperienceModal();
      return;
    }
  });

  // Modal Escape key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.modal && !elements.modal.classList.contains('hidden')) {
      closeExperienceModal();
    }
  });

  // Contact form submission
  elements.contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (validateContactForm()) {
      elements.contactForm.classList.add('hidden');
      elements.formSuccessState?.classList.remove('hidden');
    }
  });

  elements.resetFormButton?.addEventListener('click', resetContactForm);

  // Header scroll state
  window.addEventListener('scroll', updateHeaderOnScroll, { passive: true });
}

/* Catalog Data Loading & Rendering */
async function loadExperiences() {
  showLoadingState();

  try {
    const res = await fetch('./data/games.json');
    if (!res.ok) {
      throw new Error(`Failed to load catalog: ${res.status}`);
    }

    const data = await res.json();
    state.experiences = Array.isArray(data) ? data : [];

    if (state.experiences.length === 0) {
      showEmptyState();
      return;
    }

    renderExperiences();
    renderRecommendedGames();
    renderFavourites();
  } catch (err) {
    console.error('Error fetching game catalog:', err);
    showErrorState();
  }
}

function filterExperiences() {
  const query = state.searchTerm.toLowerCase();

  const filtered = state.experiences.filter((game) => {
    const matchesQuery =
      !query ||
      [
        game.name,
        game.description,
        game.category,
        game.location,
        ...(game.platforms || []),
        ...(game.tags || []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);

    const matchesCategory = state.category === 'All' || game.category === state.category;
    const matchesLocation =
      state.location === 'All Locations' || (game.platforms || [game.location]).includes(state.location);
    const matchesFeatured = state.featured !== 'Featured' || Boolean(game.featured);

    return matchesQuery && matchesCategory && matchesLocation && matchesFeatured;
  });

  // Sorting
  const sorted = [...filtered];
  switch (state.sort) {
    case 'Name A-Z':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'Name Z-A':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'Category A-Z':
      sorted.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      break;
    case 'Recommended':
    default:
      sorted.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
      break;
  }

  return sorted;
}

function renderExperiences() {
  if (!elements.resultsContainer) return;

  const results = filterExperiences();
  const isDefaultView =
    !state.searchTerm &&
    state.category === 'All' &&
    state.location === 'All Locations' &&
    state.sort === 'Recommended' &&
    state.featured === 'All';

  if (elements.resultsCount) {
    elements.resultsCount.textContent = isDefaultView
      ? `${state.experiences.length} curated games in the library`
      : `${results.length} ${results.length === 1 ? 'game found' : 'games found'}`;
  }

  if (results.length === 0) {
    showEmptyState();
    return;
  }

  elements.resultsContainer.innerHTML = results
    .map((game) => createExperienceCardMarkup(game))
    .join('');
}

function createExperienceCardMarkup(game) {
  const isSaved = favouritesSet.has(game.id);
  const platformLabel = game.platforms?.length > 1
    ? `${game.platforms[0]} + ${game.platforms.length - 1}`
    : game.platforms?.[0] || game.location;

  return `
    <article class="experience-card" data-id="${game.id}">
      <div class="card-image-wrap">
        <img src="${game.image}" alt="${game.imageAlt || game.name}" loading="lazy" />
        <span class="category-badge">${game.category}</span>
        <button
          class="favourite-btn ${isSaved ? 'active' : ''}"
          type="button"
          data-id="${game.id}"
          aria-label="${isSaved ? 'Remove from favourites' : 'Save to favourites'}"
          title="${isSaved ? 'Remove from favourites' : 'Save to favourites'}"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21s-8.5-5.2-10.5-9.6C.7 9.2 2.2 5 6.2 5c2 0 3.2 1.1 4.1 2.4C11.2 6.1 12.4 5 14.4 5c4 0 5.5 4.2 4.7 6.4C20.5 15.8 12 21 12 21Z" />
          </svg>
        </button>
      </div>
      <div class="card-content">
        <div class="card-meta">
          <span class="card-location">
            <span class="location-dot" aria-hidden="true"></span>
            ${platformLabel}
          </span>
          <span class="card-rating">Steam Store</span>
        </div>
        <h3>${game.name}</h3>
        <p>${game.description}</p>
        <div class="card-footer">
          <a class="price-tag" href="${game.imageSourceUrl}" target="_blank" rel="noreferrer">View on Steam</a>
          <button class="secondary-btn details-btn" type="button" data-id="${game.id}">
            View Details
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderRecommendedGames() {
  if (!elements.recTrack) return;

  const featured = state.experiences.filter((g) => g.featured).slice(0, 6);
  elements.recTrack.innerHTML = featured
    .map(
      (game) => `
      <article class="rec-card">
        <div class="rec-img-wrap">
          <img src="${game.image}" alt="${game.imageAlt || game.name}" loading="lazy" />
          <span class="rec-country-badge">${game.category}</span>
        </div>
        <div class="rec-card-body">
          <h3>${game.name}</h3>
          <p>${game.description}</p>
          <div class="rec-card-footer">
            <button class="rec-action-link details-btn" type="button" data-id="${game.id}">
              View Details <span aria-hidden="true">→</span>
            </button>
            <a class="rec-price-pill" href="${game.imageSourceUrl}" target="_blank" rel="noreferrer">Steam Store</a>
          </div>
        </div>
      </article>
    `
    )
    .join('');
}

/* Favourites Management */
function loadFavourites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.favourites);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((id) => favouritesSet.add(Number(id)));
      }
    }
  } catch (err) {
    console.warn('Unable to load favourites from storage:', err);
  }
  updateFavBadges();
}

function saveFavourites() {
  try {
    localStorage.setItem(STORAGE_KEYS.favourites, JSON.stringify([...favouritesSet]));
  } catch (err) {
    console.warn('Unable to save favourites to storage:', err);
  }
}

function toggleFavourite(id) {
  if (favouritesSet.has(id)) {
    favouritesSet.delete(id);
  } else {
    favouritesSet.add(id);
  }

  saveFavourites();
  updateFavBadges();

  // Update card buttons in DOM without re-rendering entire list
  document.querySelectorAll(`.favourite-btn[data-id="${id}"]`).forEach((btn) => {
    const isSaved = favouritesSet.has(id);
    btn.classList.toggle('active', isSaved);
    btn.setAttribute('aria-label', isSaved ? 'Remove from favourites' : 'Save to favourites');
    btn.setAttribute('title', isSaved ? 'Remove from favourites' : 'Save to favourites');
  });

  renderFavourites();
}

function updateFavBadges() {
  const count = String(favouritesSet.size);
  if (elements.navFavBadge) elements.navFavBadge.textContent = count;
  if (elements.mobileFavBadge) elements.mobileFavBadge.textContent = count;
}

function renderFavourites() {
  if (!elements.favouritesContainer) return;

  const savedList = state.experiences.filter((g) => favouritesSet.has(g.id));

  if (savedList.length === 0) {
    elements.favouritesContainer.innerHTML = `
      <div class="empty-state">
        <h3>Nothing saved yet</h3>
        <p>Explore the directory above and tap the heart icon on any game to build your personal queue.</p>
        <a href="#explore" class="primary-btn">Discover Titles</a>
      </div>
    `;
    return;
  }

  elements.favouritesContainer.innerHTML = savedList
    .map(
      (game) => `
      <article class="favorite-card">
        <div class="card-image-wrap">
          <img src="${game.image}" alt="${game.imageAlt || game.name}" loading="lazy" />
          <span class="category-badge">${game.category}</span>
          <button
            class="favourite-btn active"
            type="button"
            data-id="${game.id}"
            aria-label="Remove from favourites"
            title="Remove from favourites"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 21s-8.5-5.2-10.5-9.6C.7 9.2 2.2 5 6.2 5c2 0 3.2 1.1 4.1 2.4C11.2 6.1 12.4 5 14.4 5c4 0 5.5 4.2 4.7 6.4C20.5 15.8 12 21 12 21Z" />
            </svg>
          </button>
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="card-location">
              <span class="location-dot" aria-hidden="true"></span>
              ${game.location}
            </span>
            <span class="card-rating">Steam Store</span>
          </div>
          <h3>${game.name}</h3>
          <p>${game.description}</p>
          <div class="card-footer">
            <span class="price-tag">${game.priceRange}</span>
            <button class="secondary-btn details-btn" type="button" data-id="${game.id}">
              View Details
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join('');
}

/* Detail Modal Dialog- */
function openExperienceModal(id) {
  const game = state.experiences.find((g) => g.id === id);
  if (!game || !elements.modal || !elements.modalContent) return;

  const isSaved = favouritesSet.has(game.id);

  if (elements.modalHeaderFavBtn) {
    elements.modalHeaderFavBtn.dataset.id = String(game.id);
    elements.modalHeaderFavBtn.classList.toggle('active', isSaved);
    elements.modalHeaderFavBtn.setAttribute('aria-label', isSaved ? 'Remove from favourites' : 'Save to favourites');
    elements.modalHeaderFavBtn.setAttribute('title', isSaved ? 'Remove from favourites' : 'Save to favourites');
  }

  elements.modalContent.innerHTML = `
    <div class="modal-body">
      <div class="modal-image">
        <img src="${game.image}" alt="${game.imageAlt || game.name}" />
      </div>
      <div class="modal-content">
        <span class="modal-tag">${game.category}</span>
        <h3 id="modalTitle">${game.name}</h3>
        <div class="modal-meta">
          <span>${game.platforms?.join(', ') || game.location}</span>
          <span>•</span>
          <span>${game.priceRange}</span>
        </div>
        <p class="modal-description">${game.description}</p>
        <div class="modal-tags">
          ${(game.tags || []).map((tag) => `<span>#${tag}</span>`).join('')}
        </div>
        <div class="modal-why">
          <strong>Why Play</strong>
          <p>${game.whyVisit || 'Explore the official store page for details about this game.'}</p>
        </div>
        <div class="modal-actions-right">
          <button type="button" class="secondary-btn" data-close-modal="true">Close</button>
          <a class="primary-btn" href="${game.imageSourceUrl || '#'}" target="_blank" rel="noreferrer">
            <span>Open Store</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  `;

  elements.modal.classList.remove('hidden');
  elements.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeExperienceModal() {
  if (!elements.modal) return;
  elements.modal.classList.add('hidden');
  elements.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* Hero Carousel Slide Logic */
function changeHeroSlide(index) {
  state.heroIndex = index;
  const slide = heroSlides[index];
  if (!slide) return;

  if (elements.heroBgImage) {
    elements.heroBgImage.style.opacity = '0.3';
    setTimeout(() => {
      elements.heroBgImage.src = slide.image;
      elements.heroBgImage.alt = slide.alt;
      elements.heroBgImage.style.opacity = '1';
    }, 150);
  }

  if (elements.heroEyebrow) elements.heroEyebrow.textContent = slide.eyebrow;
  if (elements.heroHeadline) elements.heroHeadline.textContent = slide.headline;
  if (elements.heroLeadText) elements.heroLeadText.textContent = slide.text;

  const dots = elements.heroIndicators?.querySelectorAll('.hero-indicator-dot');
  dots?.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === index);
  });
}

function startHeroAutoSlide() {
  stopHeroAutoSlide();
  heroSlideTimer = setInterval(() => {
    const nextIdx = (state.heroIndex + 1) % heroSlides.length;
    changeHeroSlide(nextIdx);
  }, 5000);
}

function stopHeroAutoSlide() {
  if (heroSlideTimer) {
    clearInterval(heroSlideTimer);
    heroSlideTimer = null;
  }
}

/* Filter Synchronization & Preferences */
function syncCategoryTabs(selectedCat) {
  elements.categoryTabs?.querySelectorAll('.cat-pill-tab').forEach((tab) => {
    const isMatch = tab.dataset.cat === selectedCat;
    tab.classList.toggle('active', isMatch);
    tab.setAttribute('aria-selected', String(isMatch));
  });
}

function resetFilters() {
  state.searchTerm = '';
  state.category = 'All';
  state.location = 'All Locations';
  state.sort = 'Recommended';
  state.featured = 'All';

  if (elements.searchInput) elements.searchInput.value = '';
  if (elements.categoryFilter) elements.categoryFilter.value = 'All';
  if (elements.locationFilter) elements.locationFilter.value = 'All Locations';
  if (elements.sortFilter) elements.sortFilter.value = 'Recommended';
  if (elements.featuredFilter) elements.featuredFilter.value = 'All';

  syncCategoryTabs('All');
  renderExperiences();
  savePreferences();
}

function savePreferences() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.preferences,
      JSON.stringify({
        searchTerm: state.searchTerm,
        category: state.category,
        location: state.location,
        sort: state.sort,
        featured: state.featured,
      })
    );
  } catch (err) {
    console.warn('Unable to save preferences:', err);
  }
}

function loadPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.preferences);
    if (!raw) return;
    const pref = JSON.parse(raw);
    if (!pref || typeof pref !== 'object') return;

    if (pref.searchTerm) {
      state.searchTerm = pref.searchTerm;
      if (elements.searchInput) elements.searchInput.value = state.searchTerm;
    }
    if (pref.category) {
      state.category = pref.category;
      if (elements.categoryFilter) elements.categoryFilter.value = state.category;
      syncCategoryTabs(state.category);
    }
    if (pref.location) {
      state.location = pref.location;
      if (elements.locationFilter) elements.locationFilter.value = state.location;
    }
    if (pref.sort) {
      state.sort = pref.sort;
      if (elements.sortFilter) elements.sortFilter.value = state.sort;
    }
    if (pref.featured) {
      state.featured = pref.featured;
      if (elements.featuredFilter) elements.featuredFilter.value = state.featured;
    }
  } catch (err) {
    console.warn('Unable to load preferences:', err);
  }
}

/* States: Empty, Loading, Error */
function showLoadingState() {
  if (!elements.resultsContainer) return;
  const skeletons = Array.from({ length: 6 }, () => '<div class="skeleton-card"></div>').join('');
  elements.resultsContainer.innerHTML = `
    <div class="loading-state">
      <h3>Curating standout picks...</h3>
      <p>Loading handpicked games, genres, and must-try worlds.</p>
      <div class="loading-grid">${skeletons}</div>
    </div>
  `;
}

function showEmptyState() {
  if (!elements.resultsContainer) return;
  elements.resultsContainer.innerHTML = `
    <div class="empty-state">
      <h3>No matching titles found</h3>
      <p>Try clearing your filters or searching for another game, genre, or platform.</p>
      <button class="primary-btn" type="button" id="emptyResetBtn">Reset Filters</button>
    </div>
  `;
  document.getElementById('emptyResetBtn')?.addEventListener('click', resetFilters);
}

function showErrorState() {
  if (!elements.resultsContainer) return;
  elements.resultsContainer.innerHTML = `
    <div class="error-state">
      <h3>Could not load the library</h3>
      <p>There was a problem retrieving the gaming catalog. Please try again.</p>
      <button class="primary-btn" type="button" id="retryLoadBtn">Retry Now</button>
    </div>
  `;
  document.getElementById('retryLoadBtn')?.addEventListener('click', loadExperiences);
}

/* Contact Form Validation */
function validateContactForm() {
  clearContactFormErrors();

  const fullName = document.getElementById('fullName')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const subject = document.getElementById('subject')?.value.trim();
  const message = document.getElementById('message')?.value.trim();

  let isValid = true;

  if (!fullName) {
    setFormError('fullName', 'Please enter your full name.');
    isValid = false;
  }

  if (!email) {
    setFormError('email', 'Please enter your email address.');
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFormError('email', 'Please enter a valid email address.');
    isValid = false;
  }

  if (!subject) {
    setFormError('subject', 'Please add a subject.');
    isValid = false;
  }

  if (!message) {
    setFormError('message', 'Please enter a message.');
    isValid = false;
  } else if (message.length < 15) {
    setFormError('message', 'Your message should be at least 15 characters long.');
    isValid = false;
  }

  return isValid;
}

function setFormError(field, msg) {
  const errEl = document.querySelector(`[data-error-for="${field}"]`);
  if (errEl) errEl.textContent = msg;
}

function clearContactFormErrors() {
  document.querySelectorAll('.field-error').forEach((el) => {
    el.textContent = '';
  });
}

function resetContactForm() {
  elements.contactForm?.reset();
  elements.contactForm?.classList.remove('hidden');
  elements.formSuccessState?.classList.add('hidden');
  clearContactFormErrors();
}

function initContactVideo() {
  const video = document.getElementById('contactBgVideo');
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.play().catch(() => {});
}

/*  Header & Navigation Updates on Scroll */
function updateHeaderOnScroll() {
  if (!elements.header) return;
  elements.header.classList.toggle('scrolled', window.scrollY > 20);
}

function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav a[href^="#"], .mobile-menu a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const matches = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('is-active', matches);
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );

  sections.forEach((sec) => observer.observe(sec));
}
