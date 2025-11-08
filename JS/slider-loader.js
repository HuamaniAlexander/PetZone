// Carga y gestión de sliders desde el dashboard
class SliderManager {
    constructor() {
        this.sliders = [];
        this.currentIndex = 0;
        this.container = document.getElementById('topSlider');
        this.autoPlayInterval = null;
        this.init();
    }

    async init() {
        await this.cargarSliders();
        if (this.sliders.length > 0) {
            this.renderizar();
            this.iniciarAutoPlay();
        } else {
            this.ocultarSlider();
        }
    }

    async cargarSliders() {
        try {
            const response = await fetch('/ProyectoVeterinaria/api/sliders.php');
            const data = await response.json();
            
            if (data.success && data.data) {
                // Filtrar solo sliders activos y ordenarlos
                this.sliders = data.data
                    .filter(slider => slider.activo === 1 || slider.activo === '1')
                    .sort((a, b) => a.orden - b.orden);
            }
        } catch (error) {
            console.error('Error al cargar sliders:', error);
        }
    }

    renderizar() {
        if (!this.container || this.sliders.length === 0) return;

        this.container.innerHTML = '';
        this.container.classList.remove('hidden');

        this.sliders.forEach((slider, index) => {
            const sliderItem = document.createElement('div');
            sliderItem.className = `slider-item ${index === 0 ? 'active' : ''}`;
            
            const content = `
                <div class="slider-content">
                    ${slider.enlace ? `<a href="${slider.enlace}" target="_blank">` : '<div>'}
                        <div class="slider-text">
                            <h3 class="slider-title">${slider.titulo || ''}</h3>
                            ${slider.descripcion ? `<p class="slider-description">${slider.descripcion}</p>` : ''}
                        </div>
                    ${slider.enlace ? '</a>' : '</div>'}
                </div>
            `;
            
            sliderItem.innerHTML = content;
            this.container.appendChild(sliderItem);
        });

        // Agregar navegación si hay más de un slider
        if (this.sliders.length > 1) {
            this.agregarNavegacion();
        }
    }

    agregarNavegacion() {
        const nav = document.createElement('div');
        nav.className = 'slider-nav';
        
        this.sliders.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('aria-label', `Ir al slide ${index + 1}`);
            dot.addEventListener('click', () => this.irASlide(index));
            nav.appendChild(dot);
        });
        
        this.container.appendChild(nav);
    }

    irASlide(index) {
        const items = this.container.querySelectorAll('.slider-item');
        const dots = this.container.querySelectorAll('.slider-dot');
        
        items[this.currentIndex].classList.remove('active');
        dots[this.currentIndex].classList.remove('active');
        
        this.currentIndex = index;
        
        items[this.currentIndex].classList.add('active');
        dots[this.currentIndex].classList.add('active');
    }

    siguiente() {
        const nextIndex = (this.currentIndex + 1) % this.sliders.length;
        this.irASlide(nextIndex);
    }

    iniciarAutoPlay() {
        if (this.sliders.length <= 1) return;
        
        this.autoPlayInterval = setInterval(() => {
            this.siguiente();
        }, 5000); // Cambiar cada 5 segundos
    }

    detenerAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    ocultarSlider() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }

    // Método para actualizar sliders sin recargar la página
    async actualizar() {
        this.detenerAutoPlay();
        await this.cargarSliders();
        this.currentIndex = 0;
        
        if (this.sliders.length > 0) {
            this.renderizar();
            this.iniciarAutoPlay();
        } else {
            this.ocultarSlider();
        }
    }
}

// Inicializar el slider manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.sliderManager = new SliderManager();
    
    // Actualizar sliders cada 30 segundos (para cambios desde dashboard)
    setInterval(() => {
        if (window.sliderManager) {
            window.sliderManager.actualizar();
        }
    }, 30000);
});