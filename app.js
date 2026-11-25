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
  via: 'rome-via-sacra.webp',
  street: 'rome-street-life.webp',
  approach: 'rome-colosseum-approach.webp',
  entry: 'rome-colosseum-entry.webp',
  passage: 'rome-colosseum-passage.webp',
  arena: 'rome-arena-floor.webp',
  exit: 'rome-colosseum-exit.webp',
  forum: 'rome-forum.webp'
};
const photoPromises = new Map();
let timeline = [];
let renderedPair = '';
let requestedPair = '';
let pairRequest = 0;
let blend = 0;
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

function applyBlend(amount) {
  blend = amount;
  if (!renderedPair) return;
  const [from, to] = renderedPair.split('|');
  const eased = amount * amount * (3 - 2 * amount);
  photoLayers[0].style.opacity = from === to ? '1' : String(1 - eased);
  photoLayers[1].style.opacity = from === to ? '0' : String(eased);

  // A gentle forward push is tied to scroll position, not a timed animation.
  const zoom = reducedMotion ? 0 : amount * 0.16;
  const drift = reducedMotion ? 0 : amount * 1.3;
  photoLayers[0].style.transform = `scale(${1 + zoom}) translate3d(0, ${-drift}%, 0)`;
  photoLayers[1].style.transform = `scale(${1 + (reducedMotion ? 0 : (1 - amount) * 0.16)}) translate3d(0, ${reducedMotion ? 0 : (1 - amount) * 1.3}%, 0)`;
}

function renderPhotoPair(from, to, amount) {
  const key = `${from}|${to}`;
  blend = amount;
  if (key === renderedPair) {
    if (requestedPair !== key) {
      requestedPair = key;
      pairRequest++;
    }
    applyBlend(amount);
    return;
  }
  if (key === requestedPair) return;

  requestedPair = key;
  const request = ++pairRequest;
  Promise.all([loadPhoto(from), loadPhoto(to)]).then(([fromUrl, toUrl]) => {
    if (request !== pairRequest) return;
    photoLayers[0].style.backgroundImage = `url("${fromUrl}")`;
    photoLayers[1].style.backgroundImage = `url("${toUrl}")`;
    renderedPair = key;
    applyBlend(blend);
  });
}

function rebuildTimeline() {
  const top = id => {
    const section = document.getElementById(id);
    return section.getBoundingClientRect().top + scrollY;
  };
  const colosseumTop = top('colosseum');
  const forumTop = top('forum');
  timeline = [
    { at: top('home'), photo: 'threshold' },
    { at: top('city'), photo: 'via' },
    { at: top('life'), photo: 'street' },
    { at: colosseumTop, photo: 'approach' },
    { at: colosseumTop + innerHeight * 0.2, photo: 'entry' },
    { at: colosseumTop + innerHeight * 0.43, photo: 'passage' },
    { at: colosseumTop + innerHeight * 0.68, photo: 'arena' },
    { at: forumTop - innerHeight * 0.25, photo: 'exit' },
    { at: forumTop, photo: 'forum' }
  ].sort((a, b) => a.at - b.at);
}

function renderJourney() {
  if (!timeline.length) return;
  const position = scrollY;
  let index = 0;
  while (index < timeline.length - 2 && position >= timeline[index + 1].at) index++;
  const from = timeline[index];
  const to = timeline[Math.min(index + 1, timeline.length - 1)];
  const distance = Math.max(1, to.at - from.at);
  const amount = Math.max(0, Math.min(1, (position - from.at) / distance));
  renderPhotoPair(from.photo, to.photo, amount);
}

function updateJourney() {
  let active = 0;
  const focus = innerHeight * 0.5;
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= focus) active = index;
  });
  railLinks.forEach((link, index) => link.classList.toggle('active', index === active));
  renderJourney();

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

addEventListener('resize', () => {
  rebuildTimeline();
  scheduleJourneyUpdate();
}, { passive: true });
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

rebuildTimeline();
updateJourney();
Promise.all([loadPhoto('threshold'), loadPhoto('via')]).finally(() => document.body.classList.add('loaded'));
setTimeout(() => document.body.classList.add('loaded'), 1800);
