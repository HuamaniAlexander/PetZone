// Carga y gestión de anuncios desde el dashboard
class AnuncioManager {
    constructor() {
        this.anuncios = [];
        this.container = document.getElementById('bottomAnnouncement');
        this.init();
    }

    async init() {
        await this.cargarAnuncios();
        if (this.anuncios.length > 0) {
            this.renderizar();
            this.ajustarPaddingBody();
        } else {
            this.ocultarAnuncio();
        }
    }

    async cargarAnuncios() {
        try {
            const response = await fetch('/ProyectoVeterinaria/api/anuncios.php');
            const data = await response.json();
            
            if (data.success && data.data) {
                // Filtrar anuncios activos y vigentes
                const hoy = new Date();
                this.anuncios = data.data.filter(anuncio => {
                    const activo = anuncio.activo === 1 || anuncio.activo === '1';
                    
                    if (!activo) return false;
                    
                    // Verificar fechas
                    if (anuncio.fecha_inicio) {
                        const inicio = new Date(anuncio.fecha_inicio);
                        if (inicio > hoy) return false;
                    }
                    
                    if (anuncio.fecha_fin) {
                        const fin = new Date(anuncio.fecha_fin);
                        if (fin < hoy) return false;
                    }
                    
                    return true;
                });
            }
        } catch (error) {
            console.error('Error al cargar anuncios:', error);
        }
    }

    renderizar() {
        if (!this.container || this.anuncios.length === 0) return;

        this.container.innerHTML = '';
        this.container.classList.remove('hidden');

        // Tomar el primer anuncio activo
        const anuncio = this.anuncios[0];
        
        // Aplicar color de fondo personalizado
        const bgColor = anuncio.color_fondo || '#23906F';
        const textColor = anuncio.color_texto || '#ffffff';
        this.container.style.backgroundColor = bgColor;
        
        // Aplicar clase según tipo
        const tipoClass = `announcement-tipo-${anuncio.tipo || 'general'}`;
        this.container.className = `bottom-announcement ${tipoClass}`;
        
        // Crear contenido
        const duracion = anuncio.duracion || 30;
        const content = document.createElement('div');
        content.className = 'announcement-content';
        content.setAttribute('data-duration', duracion);
        content.style.animationDuration = `${duracion}s`;
        content.style.color = textColor;
        
        // Repetir el contenido para animación continua
        for (let i = 0; i < 3; i++) {
            const item = document.createElement('div');
            item.className = 'announcement-item';
            
            item.innerHTML = `
                <div class="announcement-icon">
                    ${anuncio.imagen 
                        ? `<img src="/ProyectoVeterinaria/uploads/anuncios/${anuncio.imagen}" alt="${anuncio.titulo}">` 
                        : `<span class="material-icons">${this.getIconoPorTipo(anuncio.tipo)}</span>`
                    }
                </div>
                <div class="announcement-text">
                    <h4 class="announcement-title">${anuncio.titulo}</h4>
                    <p class="announcement-message">${anuncio.mensaje}</p>
                </div>
                ${i < 2 ? '<div class="announcement-separator"></div>' : ''}
            `;
            
            content.appendChild(item);
        }
        
        // Botón cerrar
        const closeBtn = document.createElement('button');
        closeBtn.className = 'announcement-close';
        closeBtn.innerHTML = '<span class="material-icons">close</span>';
        closeBtn.setAttribute('aria-label', 'Cerrar anuncio');
        closeBtn.addEventListener('click', () => this.cerrar());
        
        this.container.appendChild(content);
        this.container.appendChild(closeBtn);
    }

    getIconoPorTipo(tipo) {
        const iconos = {
            'descuento': 'local_offer',
            'general': 'campaign',
            'evento': 'event',
            'urgente': 'warning'
        };
        return iconos[tipo] || 'campaign';
    }

    ajustarPaddingBody() {
        document.body.classList.add('has-announcement');
    }

    cerrar() {
        if (this.container) {
            this.container.classList.add('hidden');
            document.body.classList.remove('has-announcement');
            
            // Guardar en localStorage para no volver a mostrar en esta sesión
            localStorage.setItem('anuncio_cerrado', 'true');
        }
    }

    ocultarAnuncio() {
        if (this.container) {
            this.container.classList.add('hidden');
            document.body.classList.remove('has-announcement');
        }
    }

    // Método para actualizar anuncios sin recargar la página
    async actualizar() {
        await this.cargarAnuncios();
        
        if (this.anuncios.length > 0) {
            this.renderizar();
            this.ajustarPaddingBody();
        } else {
            this.ocultarAnuncio();
        }
    }
}

// Inicializar el anuncio manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el usuario cerró el anuncio en esta sesión
    const anuncioCerrado = localStorage.getItem('anuncio_cerrado');
    
    if (!anuncioCerrado) {
        window.anuncioManager = new AnuncioManager();
        
        // Actualizar anuncios cada 60 segundos (para cambios desde dashboard)
        setInterval(() => {
            if (window.anuncioManager) {
                window.anuncioManager.actualizar();
            }
        }, 60000);
    }
    
    // Limpiar el localStorage al cerrar la pestaña/navegador
    window.addEventListener('beforeunload', () => {
        localStorage.removeItem('anuncio_cerrado');
    });
});