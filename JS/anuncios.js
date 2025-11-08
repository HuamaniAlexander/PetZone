// Cargar y mostrar anuncios dinámicamente
document.addEventListener('DOMContentLoaded', async function() {
    await cargarAnuncios();
});

async function cargarAnuncios() {
    try {
        const response = await API.get('anuncios.php');
        
        if (response.data && response.data.length > 0) {
            mostrarAnuncios(response.data);
        }
    } catch (error) {
        console.error('Error al cargar anuncios:', error);
    }
}

function mostrarAnuncios(anuncios) {
    // Verificar si ya existe el anuncio
    const existingAnnouncement = document.querySelector('.bottom-announcement');
    if (existingAnnouncement) {
        existingAnnouncement.remove();
    }

    // Crear contenido repetido para efecto infinito
    let anunciosHTML = '';
    
    // Repetir anuncios 3 veces para el efecto de scroll infinito
    for (let i = 0; i < 3; i++) {
        anuncios.forEach((anuncio, index) => {
            const iconoTipo = obtenerIconoTipo(anuncio.tipo);
            anunciosHTML += `
                <div class="bottom-announcement__item">
                    <span class="material-icons bottom-announcement__icon">${iconoTipo}</span>
                    <span class="bottom-announcement__text">${anuncio.mensaje}</span>
                </div>
                ${index < anuncios.length - 1 || i < 2 ? '<span class="bottom-announcement__separator"></span>' : ''}
            `;
        });
    }

    // Color de fondo según el tipo del primer anuncio
    const colorFondo = anuncios[0].color_fondo || '#23906F';
    const colorTexto = anuncios[0].color_texto || '#ffffff';
    
    // Duración de la animación (ajustable desde el dashboard)
    const duracion = anuncios[0].duracion || 20;

    const announcementHTML = `
        <div class="bottom-announcement" id="bottomAnnouncement" style="background-color: ${colorFondo}; color: ${colorTexto};">
            <div class="bottom-announcement__wrapper" style="animation-duration: ${duracion}s;">
                <div class="bottom-announcement__content">
                    ${anunciosHTML}
                </div>
            </div>
            <button class="bottom-announcement__close" onclick="cerrarAnuncio()">
                <span class="material-icons">close</span>
            </button>
        </div>
    `;

    // Insertar al final del body
    document.body.insertAdjacentHTML('beforeend', announcementHTML);
    
    // Añadir clase al body para ajustar el margen
    document.body.classList.add('has-announcement');
}

function obtenerIconoTipo(tipo) {
    const iconos = {
        'descuento': 'local_offer',
        'general': 'info',
        'evento': 'event',
        'urgente': 'warning'
    };
    return iconos[tipo] || 'campaign';
}

// Función para cerrar el anuncio
function cerrarAnuncio() {
    const announcement = document.getElementById('bottomAnnouncement');
    if (announcement) {
        announcement.classList.add('hidden');
        document.body.classList.remove('has-announcement');
        // Guardar en localStorage
        localStorage.setItem('announcement_closed', 'true');
    }
}

// Verificar si el usuario ya cerró el anuncio
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const announcementClosed = localStorage.getItem('announcement_closed');
        if (announcementClosed === 'true') {
            const announcement = document.getElementById('bottomAnnouncement');
            if (announcement) {
                announcement.classList.add('hidden');
                document.body.classList.remove('has-announcement');
            }
        }
    }, 500);
});