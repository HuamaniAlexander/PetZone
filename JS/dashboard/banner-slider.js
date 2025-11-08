// SISTEMA DE BANNER/SLIDER Y ANUNCIOS

class BannerSliderManager {
    constructor() {
        this.sliders = [];
        this.anuncios = [];
        this.sliderActual = 0;
        this.intervalSlider = null;
        this.init();
    }

    async init() {
        await this.cargarSliders();
        await this.cargarAnuncios();
        this.renderizarBanner();
        this.renderizarAnuncio();
        this.iniciarAutoplay();
    }

    // Cargar sliders desde la API
    async cargarSliders() {
        try {
            const response = await fetch('/ProyectoVeterinaria/api/sliders.php');
            const result = await response.json();
            
            if (result.success) {
                this.sliders = result.data.filter(s => s.activo === 1 || s.activo === '1');
            }
        } catch (error) {
            console.error('Error al cargar sliders:', error);
        }
    }

    // Cargar anuncios desde la API
    async cargarAnuncios() {
        try {
            const response = await fetch('/ProyectoVeterinaria/api/anuncios.php');
            const result = await response.json();
            
            if (result.success) {
                this.anuncios = result.data.filter(a => a.activo === 1 || a.activo === '1');
            }
        } catch (error) {
            console.error('Error al cargar anuncios:', error);
        }
    }

    // Renderizar banner superior (slider)
    renderizarBanner() {
        if (this.sliders.length === 0) return;

        let bannerContainer = document.getElementById('bannerSuperior');
        
        // Crear contenedor si no existe
        if (!bannerContainer) {
            bannerContainer = document.createElement('div');
            bannerContainer.id = 'bannerSuperior';
            bannerContainer.className = 'banner-superior';
            
            const header = document.querySelector('.header');
            header.parentNode.insertBefore(bannerContainer, header);
        }

        // Mostrar slider actual
        const slider = this.sliders[this.sliderActual];
        
        bannerContainer.innerHTML = `
            <div class="banner-content" style="background-image: url('${slider.imagen}')">
                <div class="banner-overlay">
                    <h2 class="banner-titulo">${slider.titulo}</h2>
                    ${slider.descripcion ? `<p class="banner-descripcion">${slider.descripcion}</p>` : ''}
                    ${slider.enlace ? `<a href="${slider.enlace}" class="banner-btn">Ver más</a>` : ''}
                </div>
                ${this.sliders.length > 1 ? `
                    <button class="banner-nav banner-prev" onclick="bannerManager.anteriorSlider()">‹</button>
                    <button class="banner-nav banner-next" onclick="bannerManager.siguienteSlider()">›</button>
                    <div class="banner-dots">
                        ${this.sliders.map((_, index) => `
                            <span class="banner-dot ${index === this.sliderActual ? 'active' : ''}" 
                                  onclick="bannerManager.irASlider(${index})"></span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        // Aplicar estilos dinámicos
        this.aplicarEstilosBanner();
    }

    // Aplicar estilos al banner
    aplicarEstilosBanner() {
        const style = document.getElementById('bannerStyles') || document.createElement('style');
        style.id = 'bannerStyles';
        
        style.textContent = `
            .banner-superior {
                width: 100%;
                height: 60px;
                position: relative;
                overflow: hidden;
                background-color: #23906F;
            }
            
            .banner-content {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .banner-overlay {
                background: rgba(0, 0, 0, 0.5);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 0 2rem;
            }
            
            .banner-titulo {
                color: white;
                font-size: 1.2rem;
                font-weight: 700;
                margin: 0;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .banner-descripcion {
                color: white;
                font-size: 0.9rem;
                margin: 0;
                display: none;
            }
            
            .banner-btn {
                padding: 0.5rem 1.5rem;
                background-color: white;
                color: #23906F;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                font-size: 0.85rem;
                transition: all 0.3s ease;
            }
            
            .banner-btn:hover {
                background-color: #23906F;
                color: white;
                transform: scale(1.05);
            }
            
            .banner-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255, 255, 255, 0.8);
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.5rem;
                line-height: 1;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .banner-nav:hover {
                background: white;
            }
            
            .banner-prev { left: 10px; }
            .banner-next { right: 10px; }
            
            .banner-dots {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 8px;
            }
            
            .banner-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .banner-dot.active {
                background: white;
                width: 24px;
                border-radius: 4px;
            }
            
            @media (max-width: 768px) {
                .banner-superior {
                    height: 50px;
                }
                
                .banner-titulo {
                    font-size: 1rem;
                }
                
                .banner-btn {
                    display: none;
                }
                
                .banner-nav {
                    width: 30px;
                    height: 30px;
                    font-size: 1.2rem;
                }
            }
        `;
        
        if (!document.getElementById('bannerStyles')) {
            document.head.appendChild(style);
        }
    }

    // Navegación de sliders
    siguienteSlider() {
        this.sliderActual = (this.sliderActual + 1) % this.sliders.length;
        this.renderizarBanner();
    }

    anteriorSlider() {
        this.sliderActual = (this.sliderActual - 1 + this.sliders.length) % this.sliders.length;
        this.renderizarBanner();
    }

    irASlider(index) {
        this.sliderActual = index;
        this.renderizarBanner();
    }

    // Autoplay de sliders
    iniciarAutoplay() {
        if (this.sliders.length > 1) {
            this.intervalSlider = setInterval(() => {
                this.siguienteSlider();
            }, 5000); // Cambiar cada 5 segundos
        }
    }

    // Renderizar anuncio inferior
    renderizarAnuncio() {
        if (this.anuncios.length === 0) return;

        let anuncioContainer = document.getElementById('anuncioInferior');
        
        // Crear contenedor si no existe
        if (!anuncioContainer) {
            anuncioContainer = document.createElement('div');
            anuncioContainer.id = 'anuncioInferior';
            anuncioContainer.className = 'anuncio-inferior';
            
            document.body.appendChild(anuncioContainer);
        }

        // Combinar todos los anuncios en un texto deslizante
        const textosAnuncios = this.anuncios
            .map(a => `<span class="anuncio-item">${a.titulo}: ${a.mensaje}</span>`)
            .join('<span class="anuncio-separador">•</span>');

        anuncioContainer.innerHTML = `
            <div class="anuncio-scroll">
                <div class="anuncio-texto">${textosAnuncios}</div>
                <div class="anuncio-texto">${textosAnuncios}</div>
            </div>
            <button class="anuncio-cerrar" onclick="bannerManager.cerrarAnuncio()">×</button>
        `;

        // Aplicar estilos dinámicos
        this.aplicarEstilosAnuncio();
    }

    // Aplicar estilos al anuncio
    aplicarEstilosAnuncio() {
        const anuncio = this.anuncios[0]; // Usar configuración del primer anuncio
        const colorFondo = anuncio.color_fondo || '#23906F';
        const colorTexto = anuncio.color_texto || '#ffffff';
        const duracion = anuncio.duracion || 10;

        const style = document.getElementById('anuncioStyles') || document.createElement('style');
        style.id = 'anuncioStyles';
        
        style.textContent = `
            .anuncio-inferior {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background: ${colorFondo};
                color: ${colorTexto};
                padding: 0.8rem 3rem 0.8rem 1rem;
                z-index: 999;
                overflow: hidden;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            }
            
            .anuncio-scroll {
                display: flex;
                width: 200%;
                animation: scrollAnuncio ${duracion}s linear infinite;
            }
            
            .anuncio-texto {
                display: flex;
                align-items: center;
                gap: 2rem;
                white-space: nowrap;
                min-width: 50%;
            }
            
            .anuncio-item {
                font-weight: 600;
                font-size: 0.95rem;
                padding: 0 1rem;
            }
            
            .anuncio-separador {
                color: ${colorTexto};
                opacity: 0.5;
                font-size: 1.2rem;
            }
            
            .anuncio-cerrar {
                position: absolute;
                right: 0.5rem;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0,0,0,0.2);
                border: none;
                color: ${colorTexto};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.5rem;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .anuncio-cerrar:hover {
                background: rgba(0,0,0,0.4);
                transform: translateY(-50%) scale(1.1);
            }
            
            @keyframes scrollAnuncio {
                0% {
                    transform: translateX(0);
                }
                100% {
                    transform: translateX(-50%);
                }
            }
            
            @media (max-width: 768px) {
                .anuncio-inferior {
                    padding: 0.6rem 2.5rem 0.6rem 0.5rem;
                }
                
                .anuncio-item {
                    font-size: 0.85rem;
                }
                
                .anuncio-cerrar {
                    width: 25px;
                    height: 25px;
                    font-size: 1.2rem;
                }
            }
        `;
        
        if (!document.getElementById('anuncioStyles')) {
            document.head.appendChild(style);
        }
    }

    // Cerrar anuncio
    cerrarAnuncio() {
        const anuncioContainer = document.getElementById('anuncioInferior');
        if (anuncioContainer) {
            anuncioContainer.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => {
                anuncioContainer.style.display = 'none';
            }, 300);
        }
    }

    // Actualizar en tiempo real
    async actualizarContenido() {
        await this.cargarSliders();
        await this.cargarAnuncios();
        this.renderizarBanner();
        this.renderizarAnuncio();
    }
}

// Inicializar cuando el DOM esté listo
let bannerManager;
document.addEventListener('DOMContentLoaded', () => {
    bannerManager = new BannerSliderManager();
    
    // Actualizar cada 30 segundos
    setInterval(() => {
        bannerManager.actualizarContenido();
    }, 30000);
});

// Hacer disponible globalmente
window.bannerManager = bannerManager;

// Agregar animación de slideDown
const animStyle = document.createElement('style');
animStyle.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(0);
            opacity: 1;
        }
        to {
            transform: translateY(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(animStyle);