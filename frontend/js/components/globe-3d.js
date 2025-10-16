// Globo 3D con Edificios Épico - Match Property
class Globe3D {
  constructor() {
    this.container = document.querySelector('.globe-container');
    if (!this.container) return;

    this.features = [
      {
        icon: 'fa-solid fa-building',
        text: 'OFERTA INTEGRAL<br>ACTUALIZADA'
      },
      {
        icon: 'fa-solid fa-database',
        text: 'DATA ESTRUCTURADA<br>FIEL Y CONFIABLE'
      },
      {
        icon: 'fa-solid fa-filter',
        text: 'FILTROS DE BÚSQUEDA<br>SEGÚN INMUEBLE'
      },
      {
        icon: 'fa-solid fa-brain',
        text: 'PROCESO INTUITIVO CON AI<br>PARA MAXIMIZAR RESULTADOS'
      }
    ];

    this.init();
  }

  init() {
    this.createTitle();
    this.createGlobeWrapper();
    this.createGlobe();
    this.createBuildings();
    this.createParticles();
    this.addInteractivity();
  }

  createTitle() {
    const title = document.createElement('div');
    title.className = 'globe-title';
    title.innerHTML = '<span class="title-porque">POR QUÉ</span><br><span class="title-match">MATCH</span> <span class="title-property">Property?</span>';
    this.container.appendChild(title);
  }

  createGlobeWrapper() {
    this.globeWrapper = document.createElement('div');
    this.globeWrapper.className = 'globe-wrapper';
    this.container.appendChild(this.globeWrapper);
  }

  createGlobe() {
    // Crear canvas para Three.js
    const canvas = document.createElement('canvas');
    canvas.className = 'globe-canvas';
    canvas.width = 450;
    canvas.height = 450;
    
    // Configurar Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3;
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvas, 
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
    renderer.setSize(450, 450);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Crear esfera (globo)
    const geometry = new THREE.SphereGeometry(1, 64, 64);
    
    // Cargar textura con imágenes de edificios
    const textureLoader = new THREE.TextureLoader();
    
    // Crear canvas con imágenes de edificios
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 1024;
    textureCanvas.height = 512;
    const ctx = textureCanvas.getContext('2d');
    
    // Fondo azul corporativo uniforme
    ctx.fillStyle = '#1a4d7a';
    ctx.fillRect(0, 0, 1024, 512);
    
    // Agregar imágenes de edificios - ALTA CALIDAD
    const images = [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop&q=90',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop&q=90',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=400&fit=crop&q=90',
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400&h=400&fit=crop&q=90'
    ];
    
    let loadedImages = 0;
    images.forEach((src, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const x = (index % 2) * 512;
        const y = Math.floor(index / 2) * 256;
        ctx.globalAlpha = 0.4;
        ctx.drawImage(img, x, y, 512, 256);
        loadedImages++;
        if (loadedImages === images.length) {
          texture.needsUpdate = true;
        }
      };
      img.src = src;
    });
    
    const texture = new THREE.CanvasTexture(textureCanvas);
    
    // Material con textura - SIN emisión de luz
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    
    // Agregar malla amarilla sutil (wireframe)
    const wireframeGeo = new THREE.WireframeGeometry(geometry);
    const wireframeMat = new THREE.LineBasicMaterial({ 
      color: 0xf5a623,
      transparent: true, 
      opacity: 0.15,
      linewidth: 1
    });
    const wireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    scene.add(wireframe);
    
    // Animación de rotación simple (esfera + malla)
    const animate = () => {
      requestAnimationFrame(animate);
      sphere.rotation.y += 0.002;
      wireframe.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    animate();
    
    this.globeWrapper.appendChild(canvas);
    
    // Guardar referencia para responsive
    this.threeScene = { scene, camera, renderer, canvas };
  }

  createBuildings() {
    const orbit = document.createElement('div');
    orbit.className = 'buildings-orbit';

    this.features.forEach((feature, index) => {
      const building = document.createElement('div');
      building.className = 'building-item';
      building.setAttribute('data-index', index);
      building.style.setProperty('--angle', `${index * 90}deg`);

      building.innerHTML = `
        <div class="building-content">
          <i class="${feature.icon} building-icon"></i>
          <div class="building-text">${feature.text}</div>
        </div>
      `;

      orbit.appendChild(building);
    });

    this.globeWrapper.appendChild(orbit);
  }

  createParticles() {
    const particles = document.createElement('div');
    particles.className = 'particles';

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particles.appendChild(particle);
    }

    this.container.appendChild(particles);
  }

  addInteractivity() {
    const buildings = document.querySelectorAll('.building-item');
    const orbit = document.querySelector('.buildings-orbit');

    buildings.forEach(building => {
      building.addEventListener('mouseenter', () => {
        // Pausar rotación al hover
        orbit.style.animationPlayState = 'paused';
      });

      building.addEventListener('mouseleave', () => {
        // Reanudar rotación
        orbit.style.animationPlayState = 'running';
      });

      building.addEventListener('click', () => {
        // Si ya está activo, desactivar
        if (building.classList.contains('active')) {
          building.classList.remove('active');
          orbit.style.animationPlayState = 'running';
        } else {
          // Quitar active de todos
          buildings.forEach(b => b.classList.remove('active'));
          // Agregar active al clickeado
          building.classList.add('active');
          // Pausar rotación
          orbit.style.animationPlayState = 'paused';
          // Efecto de partículas
          this.createClickEffect(building);
        }
      });
    });

    // Hacer el globo arrastrable (opcional)
    this.makeGlobeDraggable();
  }

  createClickEffect(building) {
    // Efecto de click deshabilitado
  }

  makeGlobeDraggable() {
    const globe = document.querySelector('.globe');
    const orbit = document.querySelector('.buildings-orbit');
    let isDragging = false;
    let startX = 0;
    let currentRotation = 0;

    globe.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      orbit.style.animationPlayState = 'paused';
      globe.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const rotationDelta = deltaX * 0.5;
      currentRotation += rotationDelta;
      
      orbit.style.transform = `translate(-50%, -50%) rotateY(${currentRotation}deg)`;
      startX = e.clientX;
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        globe.style.cursor = 'grab';
        orbit.style.animationPlayState = 'running';
      }
    });

    globe.style.cursor = 'grab';
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new Globe3D();
});
