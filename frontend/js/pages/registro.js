// Registro Page - Match Property
class RegistroPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupHamburgerMenu();
    this.setupTipoPersonaToggle();
    this.setupRegistroForm();
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

  setupTipoPersonaToggle() {
    const tipoPersonaSelect = document.getElementById('tipoPersona');
    const datosEmpresa = document.getElementById('datosEmpresa');
    const razonSocial = document.getElementById('razonSocial');
    const ruc = document.getElementById('ruc');
    const representanteLegal = document.getElementById('representanteLegal');

    tipoPersonaSelect.addEventListener('change', (e) => {
      if (e.target.value === 'juridica') {
        datosEmpresa.style.display = 'block';
        razonSocial.required = true;
        ruc.required = true;
        representanteLegal.required = true;
      } else {
        datosEmpresa.style.display = 'none';
        razonSocial.required = false;
        ruc.required = false;
        representanteLegal.required = false;
      }
    });
  }

  setupRegistroForm() {
    const form = document.getElementById('registroForm');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Validar contraseñas
      const password = document.getElementById('passwordReg').value;
      const passwordConfirm = document.getElementById('passwordConfirm').value;

      if (password !== passwordConfirm) {
        alert('❌ Las contraseñas no coinciden\n\nPor favor verifica que ambas contraseñas sean iguales.');
        return;
      }

      if (password.length < 8) {
        alert('❌ Contraseña muy corta\n\nLa contraseña debe tener al menos 8 caracteres.');
        return;
      }

      // Obtener datos del formulario
      const tipoPersona = document.getElementById('tipoPersona').value;
      const nombre = document.getElementById('nombre').value;
      const apellido = document.getElementById('apellido').value;
      const tipoDoc = document.getElementById('tipoDoc').value;
      const numDoc = document.getElementById('numDoc').value;
      const telefono = document.getElementById('telefono').value;
      const email = document.getElementById('emailReg').value;

      const usuario = {
        tipoPersona,
        nombre,
        apellido,
        tipoDoc,
        numDoc,
        telefono,
        email,
        tipo: 'cliente'
      };

      // Si es persona jurídica, agregar datos de empresa
      if (tipoPersona === 'juridica') {
        usuario.razonSocial = document.getElementById('razonSocial').value;
        usuario.ruc = document.getElementById('ruc').value;
        usuario.representanteLegal = document.getElementById('representanteLegal').value;
      }

      // Guardar en localStorage (simulación)
      const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
      usuarios.push(usuario);
      localStorage.setItem('usuarios', JSON.stringify(usuarios));

      // Mensaje de éxito
      alert('✅ ¡Registro Exitoso!\n\nTu cuenta ha sido creada correctamente.\n\nYa puedes iniciar sesión.');

      // Redirigir a login
      window.location.href = 'login.html';
    });
  }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  new RegistroPage();
});
