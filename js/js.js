
const nav = document.getElementById("nav");

function atualizarNav() {
  if (!nav) return;
  nav.classList.toggle("scrolled", window.scrollY > 40);
}

if (nav) {
  atualizarNav();

  window.addEventListener("scroll", atualizarNav, {
    passive: true,
  });
}


// ===============================
// ANIMAÇÕES REVEAL
// ===============================

const reveals = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("in");
        observerInstance.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
    }
  );

  reveals.forEach((element) => {
    observer.observe(element);
  });
} else {
  reveals.forEach((element) => {
    element.classList.add("in");
  });
}