// Login Page - Match Property
class LoginPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupLoginForm();
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

  setupLoginForm() {
    const form = document.getElementById('loginForm');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const remember = document.getElementById('remember').checked;

      // Demo login - admin/1234
      if ((email === 'admin' || email === 'admin@match.pe') && password === '1234') {
        const usuario = {
          username: 'admin',
          email: 'admin@match.pe',
          nombre: 'Administrador',
          apellido: 'Match',
          tipo: 'admin'
        };

        // Guardar en localStorage
        localStorage.setItem('usuario', JSON.stringify(usuario));

        if (remember) {
          localStorage.setItem('remember', 'true');
        }

        // Mensaje de éxito
        alert('✅ Inicio de sesión exitoso!\n\nBienvenido, ' + usuario.nombre);

        // Redirigir a home
        window.location.href = 'index.html';
      } else {
        alert('❌ Credenciales incorrectas\n\nPara demo usa:\nUsuario: admin\nContraseña: 1234');
      }
    });
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  new LoginPage();
});
