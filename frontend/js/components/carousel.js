// Carrusel Hero - Qadrante
class Carousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll('.carousel-slide');
    this.autoPlayInterval = null;
    this.autoPlayDelay = 4000;

    this.init();
  }

  init() {
    this.startAutoPlay();

    const carousel = document.querySelector('.carousel-hero');
    carousel?.addEventListener('mouseenter', () => this.stopAutoPlay());
    carousel?.addEventListener('mouseleave', () => this.startAutoPlay());
  }

  goToSlide(index) {
    this.slides[this.currentSlide]?.classList.remove('active');
    this.currentSlide = index;
    this.slides[this.currentSlide]?.classList.add('active');
  }

  nextSlide() {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDelay);
  }

  stopAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new Carousel();
});
