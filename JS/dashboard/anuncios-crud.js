// CRUD de anuncios en el dashboard
let anunciosData = [];

// Cargar anuncios
async function cargarAnunciosDashboard() {
    try {
        const response = await API.get('dashboard/anuncios.php');
        anunciosData = response.data;
        renderizarTablaAnuncios();
    } catch (error) {
        console.error('Error al cargar anuncios:', error);
        alert('Error al cargar anuncios');
    }
}

// Renderizar tabla de anuncios
function renderizarTablaAnuncios() {
    const tbody = document.querySelector('#tablaAnuncios tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    anunciosData.forEach(anuncio => {
        const estadoBadge = anuncio.activo 
            ? '<span class="slider-status active">Activo</span>' 
            : '<span class="slider-status inactive">Inactivo</span>';
        
        const row = `
            <tr>
                <td>${anuncio.id}</td>
                <td>${anuncio.titulo}</td>
                <td>${anuncio.tipo}</td>
                <td>${anuncio.fecha_inicio || 'N/A'}</td>
                <td>${anuncio.fecha_fin || 'N/A'}</td>
                <td>${estadoBadge}</td>
                <td class="action-btns">
                    <button class="btn-edit" onclick="editarAnuncio(${anuncio.id})">✏️ Editar</button>
                    <button class="btn-delete" onclick="eliminarAnuncio(${anuncio.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Editar anuncio
function editarAnuncio(id) {
    const anuncio = anunciosData.find(a => a.id === id);
    if (!anuncio) return;
    
    // Llenar formulario con datos
    document.getElementById('anuncioTitulo').value = anuncio.titulo;
    document.getElementById('anuncioMensaje').value = anuncio.mensaje;
    document.getElementById('anuncioTipo').value = anuncio.tipo;
    document.getElementById('anuncioDuracion').value = anuncio.duracion;
    document.getElementById('anuncioColorFondo').value = anuncio.color_fondo;
    document.getElementById('anuncioColorTexto').value = anuncio.color_texto;
    document.getElementById('anuncioActivo').checked = anuncio.activo == 1;
    document.getElementById('anuncioFechaInicio').value = anuncio.fecha_inicio || '';
    document.getElementById('anuncioFechaFin').value = anuncio.fecha_fin || '';
    
    // Mostrar formulario en modo edición
    toggleForm('formAnuncios');
    
    // Guardar ID para actualización
    document.getElementById('formAnuncios').dataset.editId = id;
}

// Crear anuncio
async function crearAnuncio(formData) {
    try {
        const response = await API.post('dashboard/anuncios.php', formData);
        alert(response.message);
        await cargarAnunciosDashboard();
        toggleForm('formAnuncios');
    } catch (error) {
        alert('Error al crear anuncio: ' + error.message);
    }
}

// Actualizar anuncio
async function actualizarAnuncio(id, formData) {
    try {
        const response = await API.put('dashboard/anuncios.php', { id, ...formData });
        alert(response.message);
        await cargarAnunciosDashboard();
        toggleForm('formAnuncios');
    } catch (error) {
        alert('Error al actualizar anuncio: ' + error.message);
    }
}

// Eliminar anuncio
async function eliminarAnuncio(id) {
    if (!confirm('¿Está seguro que desea eliminar este anuncio?')) return;
    
    try {
        const response = await API.delete('dashboard/anuncios.php', { id });
        alert(response.message);
        await cargarAnunciosDashboard();
    } catch (error) {
        alert('Error al eliminar anuncio: ' + error.message);
    }
}

// Event listener para formulario de anuncios
document.addEventListener('DOMContentLoaded', function() {
    const formAnuncios = document.getElementById('formAnuncios');
    if (formAnuncios) {
        const form = formAnuncios.querySelector('form');
        if (form) {
            form.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const formData = {
                    titulo: document.getElementById('anuncioTitulo').value,
                    mensaje: document.getElementById('anuncioMensaje').value,
                    tipo: document.getElementById('anuncioTipo').value,
                    duracion: parseInt(document.getElementById('anuncioDuracion').value),
                    color_fondo: document.getElementById('anuncioColorFondo').value,
                    color_texto: document.getElementById('anuncioColorTexto').value,
                    activo: document.getElementById('anuncioActivo').checked,
                    fecha_inicio: document.getElementById('anuncioFechaInicio').value,
                    fecha_fin: document.getElementById('anuncioFechaFin').value
                };
                
                const editId = formAnuncios.dataset.editId;
                
                if (editId) {
                    await actualizarAnuncio(editId, formData);
                    delete formAnuncios.dataset.editId;
                } else {
                    await crearAnuncio(formData);
                }
                
                this.reset();
            });
        }
    }
});