import '@fontsource/italiana/latin-400.css';
import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-mono/latin-400.css';
import '@fontsource/dm-mono/latin-500.css';

document.documentElement.classList.add('js');

const sections = [...document.querySelectorAll('.scene-section')];
const railLinks = [...document.querySelectorAll('.rail-item')];
const photoLayers = [...document.querySelectorAll('.photo-layer')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const imageBase = import.meta.env.BASE_URL;
const photoFiles = {
  threshold: 'rome-threshold.webp',
  street: 'rome-street-life.webp',
  colosseum: 'rome-colosseum.webp',
  forum: 'rome-forum.webp'
};
const photoPromises = new Map();
let activeLayer = -1;
let requestedPhoto = '';
let photoRequest = 0;
let scrollFrame = 0;

function loadPhoto(name) {
  if (!photoPromises.has(name)) {
    const src = `${imageBase}images/${photoFiles[name]}`;
    photoPromises.set(name, new Promise(resolve => {
      const image = new Image();
      image.onload = () => resolve(src);
      image.onerror = () => resolve(src);
      image.src = src;
    }));
  }
  return photoPromises.get(name);
}

async function showPhoto(name) {
  if (!photoFiles[name] || name === requestedPhoto) return;
  requestedPhoto = name;
  const request = ++photoRequest;
  const src = await loadPhoto(name);
  if (request !== photoRequest) return;
  const nextLayer = activeLayer === 0 ? 1 : 0;
  photoLayers[nextLayer].style.backgroundImage = `url("${src}")`;
  photoLayers[nextLayer].classList.add('is-active');
  if (activeLayer >= 0) photoLayers[activeLayer].classList.remove('is-active');
  activeLayer = nextLayer;
}

function updateJourney() {
  let active = 0;
  const focus = innerHeight * 0.5;
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= focus) active = index;
  });
  railLinks.forEach((link, index) => link.classList.toggle('active', index === active));
  showPhoto(sections[active]?.dataset.photo);

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const progress = Math.max(0, Math.min(1, scrollY / maxScroll));
  document.documentElement.style.setProperty('--progress', `${progress * 100}%`);
}

function scheduleJourneyUpdate() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    updateJourney();
  });
}

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  sections.forEach(section => revealObserver.observe(section));
} else {
  sections.forEach(section => section.classList.add('in-view'));
}

addEventListener('resize', scheduleJourneyUpdate, { passive: true });
addEventListener('scroll', scheduleJourneyUpdate, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });
});

const tickets = [...document.querySelectorAll('.ticket-card')];
const guestsInput = document.querySelector('#guests');
const totalOutput = document.querySelector('#booking-total');
let selectedTicket = 'Standard';
let selectedPrice = 18;

function updateTotal() {
  totalOutput.textContent = `€${selectedPrice * Number(guestsInput.value)}`;
}

tickets.forEach(card => card.addEventListener('click', () => {
  selectedTicket = card.dataset.ticket;
  selectedPrice = Number(card.dataset.price);
  tickets.forEach(ticket => {
    const selected = ticket === card;
    ticket.classList.toggle('selected', selected);
    ticket.setAttribute('aria-pressed', String(selected));
    ticket.querySelector('.ticket-select').innerHTML = selected ? 'SELECTED <b>✓</b>' : 'SELECT <b>＋</b>';
  });
  updateTotal();
}));
guestsInput.addEventListener('change', updateTotal);

const dateInput = document.querySelector('#visit-date');
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = localDate;

document.querySelector('#booking-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = form.querySelector('.form-message');
  const email = form.elements.namedItem('email').value.trim();
  const date = form.elements.namedItem('date').value;
  const guests = form.elements.namedItem('guests').value;
  message.textContent = '';

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    message.textContent = 'Please enter a valid email address.';
    form.elements.namedItem('email').focus();
    return;
  }
  if (!date || date < localDate) {
    message.textContent = 'Choose a valid visit date to continue.';
    dateInput.focus();
    return;
  }

  const prettyDate = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  message.textContent = `Preview reservation ready: ${guests} ${Number(guests) === 1 ? 'guest' : 'guests'} · ${selectedTicket} · €${selectedPrice * Number(guests)} · ${prettyDate}. No booking or email has been sent.`;
  form.querySelector('.reserve-button span:first-child').textContent = 'VISIT RESERVED';
});

showPhoto(sections[0]?.dataset.photo).finally(() => document.body.classList.add('loaded'));
updateJourney();
setTimeout(() => document.body.classList.add('loaded'), 1800);
