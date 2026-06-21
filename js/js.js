const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 40) { nav.classList.add('scrolled'); } else { nav.classList.remove('scrolled'); }
});

const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); } });
}, { threshold: .15 });
reveals.forEach(el => io.observe(el));