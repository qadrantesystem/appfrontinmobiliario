// Logo Animation - Match Property
// Detectar iOS
const iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
if (iOS) document.body.classList.add('iOS');

class LogoAnimation {
  constructor() {
    this.canvas = document.querySelector('.particles-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.animations = [];
    this.colors = ['#003366', '#5B9BD5', '#F5A623'];

    if (this.canvas) {
      this.setCanvasSize();
      window.addEventListener('resize', () => this.setCanvasSize(), false);
    }
  }

  setCanvasSize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticle(x, y) {
    const p = {};
    p.x = x;
    p.y = y;
    p.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    p.radius = Math.random() * 4 + 2;
    p.vx = (Math.random() - 0.5) * 8;
    p.vy = (Math.random() - 0.5) * 8;
    p.alpha = 1;
    p.draw = () => {
      if (!this.ctx) return;
      this.ctx.globalAlpha = p.alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
      this.ctx.globalAlpha = 1;
    };
    return p;
  }

  burst(x, y, count = 20) {
    if (!this.ctx || !window.anime) return;

    const particles = [];
    for (let i = 0; i < count; i++) {
      particles.push(this.createParticle(x, y));
    }

    const animation = anime({
      targets: particles,
      x: (p) => p.x + p.vx * 50,
      y: (p) => p.y + p.vy * 50,
      alpha: 0,
      radius: 0,
      duration: 1000,
      easing: 'easeOutExpo'
    });

    this.animations.push({ animation, particles });
  }

  animate() {
    if (!this.ctx) return;

    const loop = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.animations.forEach(({ particles }) => {
        particles.forEach(p => p.draw());
      });

      requestAnimationFrame(loop);
    };

    loop();
  }

  start() {
    if (!window.anime) {
      console.error('Anime.js no está cargado');
      this.fallbackAnimation();
      return;
    }

    this.animate();
    document.body.classList.add('ready');

    // Hacer el logo visible desde el principio
    const logo = document.querySelector('.animated-logo');
    if (logo) logo.style.opacity = '1';

    const timeline = anime.timeline({
      easing: 'easeOutExpo'
    });

    // 1. Aparecer letra por letra MATCH
    timeline.add({
      targets: '#letter-m, #letter-a, #letter-t, #letter-c, #letter-h',
      opacity: [0, 1],
      translateY: [-50, 0],
      delay: anime.stagger(150, {start: 300}),
      duration: 600
    });

    // 2. Círculos rebotan desde arriba
    timeline.add({
      targets: '#circle-1',
      opacity: [0, 1],
      translateY: [-300, 0],
      duration: 800,
      elasticity: 600,
      complete: () => {
        const circle = document.getElementById('circle-1');
        const rect = circle.getBoundingClientRect();
        this.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
      }
    }, '-=200');

    timeline.add({
      targets: '#circle-2',
      opacity: [0, 1],
      translateY: [-300, 0],
      duration: 800,
      elasticity: 600,
      complete: () => {
        const circle = document.getElementById('circle-2');
        const rect = circle.getBoundingClientRect();
        this.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
      }
    }, '-=600');

    timeline.add({
      targets: '#circle-3',
      opacity: [0, 1],
      translateY: [-300, 0],
      duration: 800,
      elasticity: 600,
      complete: () => {
        const circle = document.getElementById('circle-3');
        const rect = circle.getBoundingClientRect();
        this.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 15);
      }
    }, '-=600');

    // 3. Aparecer PROPERTY
    timeline.add({
      targets: '#text-property',
      opacity: [0, 1],
      scale: [0.8, 1],
      duration: 600
    }, '-=200');

    // 4. Aparecer IA REAL ESTATE
    timeline.add({
      targets: '#text-ia, #text-realestate',
      opacity: [0, 1],
      translateX: (el, i) => [i === 0 ? -20 : 20, 0],
      duration: 500
    });

    // 5. Esperar 5 segundos mostrando el logo
    timeline.add({
      duration: 5000
    });

    // 6. Mover todo el logo arriba (al header)
    timeline.add({
      targets: '.logo-animation-container',
      scale: [1, 0.3],
      translateY: [0, -window.innerHeight / 2 + 60],
      duration: 1000,
      easing: 'easeInOutQuad',
      complete: () => {
        // Ocultar pantalla de carga
        document.querySelector('.loading-screen').classList.add('hidden');
        // Mostrar logo en header
        const headerLogo = document.querySelector('.header-logo-small');
        if (headerLogo) headerLogo.classList.add('visible');

        // Eliminar loading screen después de la transición
        setTimeout(() => {
          const loadingScreen = document.querySelector('.loading-screen');
          if (loadingScreen) loadingScreen.remove();
        }, 1000);
      }
    });
  }

  fallbackAnimation() {
    // Animación simple si anime.js no carga
    setTimeout(() => {
      document.querySelector('.loading-screen').classList.add('hidden');
      const headerLogo = document.querySelector('.header-logo-small');
      if (headerLogo) headerLogo.classList.add('visible');
      setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) loadingScreen.remove();
      }, 1000);
    }, 3000);
  }
}

// Iniciar animación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const animation = new LogoAnimation();

  // Esperar un poco para asegurar que todo esté cargado
  setTimeout(() => {
    animation.start();
  }, 500);
});
