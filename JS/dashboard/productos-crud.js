// JS/dashboard/productos-crud.js - CRUD de Productos en Dashboard

const API_URL = '/ProyectoVeterinaria/api/dashboard/productos.php';

let currentProductos = [];
let editingProductId = null;

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('section-productos')) {
        loadProductos();
        setupProductosEventListeners();
    }
});

// Configurar event listeners
function setupProductosEventListeners() {
    // Botón agregar producto
    const btnAgregar = document.querySelector('[data-section="productos"] .add-btn');
    if (btnAgregar) {
        btnAgregar.addEventListener('click', () => {
            editingProductId = null;
            document.getElementById('formProductos').classList.add('active');
            document.getElementById('productoForm').reset();
        });
    }

    // Formulario de producto
    const form = document.getElementById('productoForm');
    if (form) {
        form.addEventListener('submit', handleProductoSubmit);
    }

    // Botón cancelar
    const btnCancelar = document.querySelector('#formProductos .btn-cancel');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            document.getElementById('formProductos').classList.remove('active');
            editingProductId = null;
        });
    }

    // Filtros
    const filtroCategoria = document.getElementById('filtroCategoria');
    const filtroBusqueda = document.getElementById('filtroBusqueda');
    
    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', loadProductos);
    }
    
    if (filtroBusqueda) {
        filtroBusqueda.addEventListener('input', debounce(loadProductos, 500));
    }
}

// Cargar productos desde la API
async function loadProductos() {
    try {
        const categoria = document.getElementById('filtroCategoria')?.value || '';
        const busqueda = document.getElementById('filtroBusqueda')?.value || '';
        
        let url = `${API_URL}?action=list`;
        if (categoria) url += `&categoria=${categoria}`;
        if (busqueda) url += `&busqueda=${busqueda}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            currentProductos = data.productos;
            renderProductosTable(data.productos);
        } else {
            showNotification('Error al cargar productos', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Renderizar tabla de productos
function renderProductosTable(productos) {
    const tbody = document.querySelector('#tablaProductos tbody');
    if (!tbody) return;

    if (productos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem;">
                    No hay productos para mostrar
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = productos.map(producto => `
        <tr>
            <td>${producto.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    ${producto.imagen ? `<img src="${producto.imagen}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">` : ''}
                    <span>${producto.nombre}</span>
                </div>
            </td>
            <td>${producto.descripcion || '-'}</td>
            <td><span class="badge badge-${producto.categoria}">${capitalizeFirst(producto.categoria)}</span></td>
            <td>S/. ${parseFloat(producto.precio).toFixed(2)}</td>
            <td>
                <span class="stock-badge ${producto.stock < 10 ? 'stock-low' : ''}">${producto.stock}</span>
            </td>
            <td class="action-btns">
                <button class="btn-edit" onclick="editProducto(${producto.id})">
                    ✏️ Editar
                </button>
                <button class="btn-delete" onclick="deleteProducto(${producto.id})">
                    🗑️ Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Manejar envío del formulario
async function handleProductoSubmit(e) {
    e.preventDefault();

    const formData = {
        nombre: document.getElementById('productoNombre').value,
        descripcion: document.getElementById('productoDescripcion').value,
        categoria: document.getElementById('productoCategoria').value,
        precio: parseFloat(document.getElementById('productoPrecio').value),
        stock: parseInt(document.getElementById('productoStock').value),
        imagen: document.getElementById('productoImagen').value,
        destacado: document.getElementById('productoDestacado')?.checked || false,
        activo: document.getElementById('productoActivo')?.checked !== false
    };

    try {
        let url = `${API_URL}?action=${editingProductId ? 'update' : 'create'}`;
        if (editingProductId) {
            url += `&id=${editingProductId}`;
        }

        const response = await fetch(url, {
            method: editingProductId ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            document.getElementById('formProductos').classList.remove('active');
            document.getElementById('productoForm').reset();
            editingProductId = null;
            loadProductos();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al guardar producto', 'error');
    }
}

// Editar producto
async function editProducto(id) {
    try {
        const response = await fetch(`${API_URL}?action=get&id=${id}`);
        const data = await response.json();

        if (data.success) {
            const producto = data.producto;
            editingProductId = id;

            document.getElementById('productoNombre').value = producto.nombre;
            document.getElementById('productoDescripcion').value = producto.descripcion || '';
            document.getElementById('productoCategoria').value = producto.categoria;
            document.getElementById('productoPrecio').value = producto.precio;
            document.getElementById('productoStock').value = producto.stock;
            document.getElementById('productoImagen').value = producto.imagen || '';
            
            if (document.getElementById('productoDestacado')) {
                document.getElementById('productoDestacado').checked = producto.destacado == 1;
            }
            if (document.getElementById('productoActivo')) {
                document.getElementById('productoActivo').checked = producto.activo == 1;
            }

            document.getElementById('formProductos').classList.add('active');
            document.getElementById('formProductos').scrollIntoView({ behavior: 'smooth' });
        } else {
            showNotification('Error al cargar producto', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexión', 'error');
    }
}

// Eliminar producto
async function deleteProducto(id) {
    if (!confirm('¿Está seguro que desea eliminar este producto?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}?action=delete&id=${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showNotification(data.message, 'success');
            loadProductos();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error al eliminar producto', 'error');
    }
}

// Utilidades
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#23906F' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Estilos CSS para las notificaciones y badges
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
    .badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .badge-comida { background-color: #FFE5E5; color: #C41E3A; }
    .badge-juguetes { background-color: #E5F5FF; color: #0066CC; }
    .badge-aseo { background-color: #E8F5E9; color: #2E7D32; }
    .badge-antipulgas { background-color: #FFF3E0; color: #E65100; }
    .badge-accesorios { background-color: #F3E5F5; color: #6A1B9A; }
    .stock-badge {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        background-color: #E8F5E9;
        color: #2E7D32;
        font-weight: 600;
    }
    .stock-low {
        background-color: #FFEBEE;
        color: #C62828;
    }
`;
document.head.appendChild(style);