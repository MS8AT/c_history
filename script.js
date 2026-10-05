const header = document.querySelector("[data-header]");
const stars = document.querySelector("[data-stars]");
const soundButton = document.querySelector("[data-sound]");
const soundLabel = document.querySelector("[data-sound-label]");
const pathProgress = document.querySelector("[data-path-progress]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function createStars() {
  if (!stars) return;

  const fragment = document.createDocumentFragment();
  const count = window.innerWidth < 640 ? 34 : 68;

  for (let index = 0; index < count; index += 1) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${(index * 47 + 13) % 100}%`;
    star.style.top = `${(index * 71 + 9) % 92}%`;
    star.style.setProperty("--duration", `${3 + (index % 6) * 0.65}s`);
    star.style.setProperty("--delay", `${(index % 9) * -0.4}s`);
    fragment.append(star);
  }

  stars.replaceChildren(fragment);
}

function updateScrollState() {
  header?.classList.toggle("scrolled", window.scrollY > 24);

  if (!pathProgress) return;
  const story = pathProgress.parentElement?.parentElement;
  if (!story) return;

  const bounds = story.getBoundingClientRect();
  const range = Math.max(bounds.height - window.innerHeight, 1);
  const travelled = Math.min(Math.max(-bounds.top + window.innerHeight * 0.35, 0), range);
  pathProgress.style.height = `${(travelled / range) * 100}%`;
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 },
  );

  items.forEach((item) => observer.observe(item));
}

function toggleStarlight() {
  if (!stars || !soundButton || !soundLabel) return;
  const active = soundButton.getAttribute("aria-pressed") !== "true";
  soundButton.setAttribute("aria-pressed", String(active));
  soundLabel.textContent = active ? "Успокоить звёзды" : "Оживить звёзды";
  stars.classList.toggle("alive", active);
}

createStars();
setupReveal();
updateScrollState();

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState, { passive: true });
soundButton?.addEventListener("click", toggleStarlight);
