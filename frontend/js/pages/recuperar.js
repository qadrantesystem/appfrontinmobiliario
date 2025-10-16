// Recuperar Contraseña Page - Match Property
class RecuperarPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupRecuperarForm();
  }

  setupHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
      });

      navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        });
      });

      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    }
  }

  setupRecuperarForm() {
    const form = document.getElementById('recuperarForm');
    const successMessage = document.getElementById('successMessage');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('emailRecuperar').value;

      // Validar que el email tenga formato correcto
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('❌ Correo inválido\n\nPor favor ingresa un correo electrónico válido.');
        return;
      }

      // Simular envío de correo (en producción llamaría al backend)
      console.log('Correo de recuperación enviado a:', email);

      // Ocultar formulario y mostrar mensaje de éxito
      form.style.display = 'none';
      successMessage.style.display = 'block';

      // Opcional: redirigir a login después de 5 segundos
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 5000);
    });
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  new RecuperarPage();
});
