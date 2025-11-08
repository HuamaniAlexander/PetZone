// CRUD DE PRODUCTOS MEJORADO CON FILTROS Y PAGINACIÓN

class ProductosManager {
    constructor() {
        this.productos = [];
        this.productosFiltrados = [];
        this.paginaActual = 1;
        this.productosPorPagina = 10;
        this.categoriaFiltro = 'todos';
        this.busquedaTexto = '';
        this.productoEditando = null;
        this.init();
    }

    async init() {
        await this.cargarProductos();
        this.setupEventListeners();
        this.renderizar();
    }

    // Cargar productos desde la API
    async cargarProductos() {
        try {
            this.mostrarLoading(true);
            const response = await fetch('/ProyectoVeterinaria/api/dashboard/productos.php', {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('dashboard_token')
                }
            });

            const result = await response.json();

            if (result.success) {
                this.productos = result.data;
                this.aplicarFiltros();
                this.renderizar();
                this.actualizarEstadisticas();
            } else {
                this.mostrarNotificacion('Error al cargar productos', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.mostrarNotificacion('Error de conexión', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }

    // Aplicar filtros de búsqueda y categoría
    aplicarFiltros() {
        this.productosFiltrados = this.productos.filter(producto => {
            const cumpleCategoria = this.categoriaFiltro === 'todos' || 
                                   producto.categoria === this.categoriaFiltro;
            
            const cumpleBusqueda = this.busquedaTexto === '' ||
                                  producto.nombre.toLowerCase().includes(this.busquedaTexto.toLowerCase()) ||
                                  producto.descripcion.toLowerCase().includes(this.busquedaTexto.toLowerCase());
            
            return cumpleCategoria && cumpleBusqueda;
        });

        this.paginaActual = 1; // Reset a primera página
    }

    // Obtener productos para la página actual
    obtenerProductosPagina() {
        const inicio = (this.paginaActual - 1) * this.productosPorPagina;
        const fin = inicio + this.productosPorPagina;
        return this.productosFiltrados.slice(inicio, fin);
    }

    // Calcular total de páginas
    calcularTotalPaginas() {
        return Math.ceil(this.productosFiltrados.length / this.productosPorPagina);
    }

    // Renderizar tabla de productos
    renderizar() {
        const tbody = document.querySelector('#tablaProductos tbody');
        if (!tbody) return;

        const productos = this.obtenerProductosPagina();

        if (productos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #999;">
                        No se encontraron productos
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = productos.map(producto => `
            <tr data-id="${producto.id}">
                <td>${producto.id}</td>
                <td>
                    ${producto.imagen ? 
                        `<img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen">` 
                        : '📦'}
                </td>
                <td><strong>${producto.nombre}</strong></td>
                <td>${producto.descripcion || '-'}</td>
                <td>
                    <span class="badge badge-${producto.categoria}">
                        ${this.formatearCategoria(producto.categoria)}
                    </span>
                </td>
                <td><strong>S/ ${parseFloat(producto.precio).toFixed(2)}</strong></td>
                <td>
                    <span class="${this.getStockClass(producto.stock)}">
                        ${producto.stock}
                    </span>
                </td>
                <td class="action-btns">
                    <button class="btn-edit" onclick="productosManager.editarProducto(${producto.id})">
                        ✏️ Editar
                    </button>
                    <button class="btn-delete" onclick="productosManager.eliminarProducto(${producto.id})">
                        🗑️ Eliminar
                    </button>
                </td>
            </tr>
        `).join('');

        this.renderizarPaginacion();
    }

    // Renderizar controles de paginación
    renderizarPaginacion() {
        const paginacionContainer = document.querySelector('.paginacion');
        if (!paginacionContainer) return;

        const totalPaginas = this.calcularTotalPaginas();

        if (totalPaginas <= 1) {
            paginacionContainer.innerHTML = '';
            return;
        }

        let html = `
            <button class="paginacion-btn" onclick="productosManager.cambiarPagina(${this.paginaActual - 1})" 
                    ${this.paginaActual === 1 ? 'disabled' : ''}>
                ◀ Anterior
            </button>
        `;

        for (let i = 1; i <= totalPaginas; i++) {
            html += `
                <button class="paginacion-btn ${i === this.paginaActual ? 'active' : ''}" 
                        onclick="productosManager.cambiarPagina(${i})">
                    ${i}
                </button>
            `;
        }

        html += `
            <button class="paginacion-btn" onclick="productosManager.cambiarPagina(${this.paginaActual + 1})" 
                    ${this.paginaActual === totalPaginas ? 'disabled' : ''}>
                Siguiente ▶
            </button>
        `;

        paginacionContainer.innerHTML = html;
    }

    // Cambiar página
    cambiarPagina(nuevaPagina) {
        const totalPaginas = this.calcularTotalPaginas();
        
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
        
        this.paginaActual = nuevaPagina;
        this.renderizar();
        
        // Scroll suave a la tabla
        document.querySelector('#tablaProductos')?.scrollIntoView({ behavior: 'smooth' });
    }

    // Abrir modal para crear producto
    abrirModalCrear() {
        this.productoEditando = null;
        const modal = document.getElementById('modalProducto');
        const form = document.getElementById('formProducto');
        
        form.reset();
        document.querySelector('#modalProducto .modal-title').textContent = 'Agregar Nuevo Producto';
        modal.classList.add('active');
    }

    // Editar producto
    async editarProducto(id) {
        const producto = this.productos.find(p => p.id === id);
        if (!producto) return;

        this.productoEditando = producto;
        
        const modal = document.getElementById('modalProducto');
        const form = document.getElementById('formProducto');
        
        // Llenar formulario
        form.querySelector('[name="nombre"]').value = producto.nombre;
        form.querySelector('[name="descripcion"]').value = producto.descripcion || '';
        form.querySelector('[name="categoria"]').value = producto.categoria;
        form.querySelector('[name="precio"]').value = producto.precio;
        form.querySelector('[name="stock"]').value = producto.stock;
        
        // Mostrar preview de imagen si existe
        if (producto.imagen) {
            const preview = document.getElementById('imagePreview');
            preview.src = producto.imagen;
            preview.classList.add('active');
        }
        
        document.querySelector('#modalProducto .modal-title').textContent = 'Editar Producto';
        modal.classList.add('active');
    }

    // Guardar producto (crear o actualizar)
    async guardarProducto(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            categoria: formData.get('categoria'),
            precio: parseFloat(formData.get('precio')),
            stock: parseInt(formData.get('stock'))
        };

        // Validaciones
        if (!data.nombre || !data.categoria || !data.precio) {
            this.mostrarNotificacion('Complete todos los campos obligatorios', 'error');
            return;
        }

        try {
            this.mostrarLoading(true);

            let response;
            if (this.productoEditando) {
                // Actualizar
                data.id = this.productoEditando.id;
                response = await fetch('/ProyectoVeterinaria/api/dashboard/productos.php', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('dashboard_token')
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Crear
                response = await fetch('/ProyectoVeterinaria/api/dashboard/productos.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('dashboard_token')
                    },
                    body: JSON.stringify(data)
                });
            }

            const result = await response.json();

            if (result.success) {
                this.mostrarNotificacion(result.message, 'success');
                this.cerrarModal();
                await this.cargarProductos();
                
                // Actualizar productos.html sin recargar
                this.actualizarProductosPublicos();
            } else {
                this.mostrarNotificacion(result.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.mostrarNotificacion('Error al guardar producto', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }

    // Eliminar producto
    async eliminarProducto(id) {
        if (!confirm('¿Está seguro que desea eliminar este producto?')) return;

        try {
            this.mostrarLoading(true);

            const response = await fetch('/ProyectoVeterinaria/api/dashboard/productos.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('dashboard_token')
                },
                body: JSON.stringify({ id })
            });

            const result = await response.json();

            if (result.success) {
                this.mostrarNotificacion(result.message, 'success');
                await this.cargarProductos();
                
                // Actualizar productos.html
                this.actualizarProductosPublicos();
            } else {
                this.mostrarNotificacion(result.message, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            this.mostrarNotificacion('Error al eliminar producto', 'error');
        } finally {
            this.mostrarLoading(false);
        }
    }

    // Actualizar productos en la página pública (productos.html)
    async actualizarProductosPublicos() {
        // Emitir evento personalizado para que productos.js lo escuche
        window.dispatchEvent(new CustomEvent('productosActualizados'));
    }

    // Setup event listeners
    setupEventListeners() {
        // Filtro de búsqueda
        const inputBusqueda = document.getElementById('busquedaProducto');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('input', (e) => {
                this.busquedaTexto = e.target.value;
                this.aplicarFiltros();
                this.renderizar();
            });
        }

        // Filtro de categoría
        const selectCategoria = document.getElementById('filtroCategoria');
        if (selectCategoria) {
            selectCategoria.addEventListener('change', (e) => {
                this.categoriaFiltro = e.target.value;
                this.aplicarFiltros();
                this.renderizar();
            });
        }

        // Formulario de producto
        const formProducto = document.getElementById('formProducto');
        if (formProducto) {
            formProducto.addEventListener('submit', (e) => this.guardarProducto(e));
        }

        // Botón agregar producto
        const btnAgregar = document.getElementById('btnAgregarProducto');
        if (btnAgregar) {
            btnAgregar.addEventListener('click', () => this.abrirModalCrear());
        }

        // Cerrar modal
        const btnCerrarModal = document.querySelector('#modalProducto .modal-close');
        if (btnCerrarModal) {
            btnCerrarModal.addEventListener('click', () => this.cerrarModal());
        }

        // Preview de imagen
        const inputImagen = document.querySelector('[name="imagen"]');
        if (inputImagen) {
            inputImagen.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const preview = document.getElementById('imagePreview');
                        preview.src = e.target.result;
                        preview.classList.add('active');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    // Cerrar modal
    cerrarModal() {
        const modal = document.getElementById('modalProducto');
        if (modal) {
            modal.classList.remove('active');
        }
        this.productoEditando = null;
    }

    // Actualizar estadísticas
    actualizarEstadisticas() {
        const totalProductos = this.productos.length;
        const stockBajo = this.productos.filter(p => p.stock < 10).length;
        const valorInventario = this.productos.reduce((total, p) => total + (p.precio * p.stock), 0);

        document.querySelector('[data-stat="total-productos"]')?.textContent = totalProductos;
        document.querySelector('[data-stat="stock-bajo"]')?.textContent = stockBajo;
        document.querySelector('[data-stat="valor-inventario"]')?.textContent = 
            `S/ ${valorInventario.toFixed(2)}`;
    }

    // Utilidades
    formatearCategoria(categoria) {
        const categorias = {
            'comida': 'Comida',
            'juguetes': 'Juguetes',
            'aseo': 'Aseo',
            'antipulgas': 'Antipulgas',
            'accesorios': 'Accesorios'
        };
        return categorias[categoria] || categoria;
    }

    getStockClass(stock) {
        if (stock < 10) return 'stock-bajo';
        if (stock < 30) return 'stock-medio';
        return 'stock-alto';
    }

    mostrarLoading(mostrar) {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.toggle('active', mostrar);
        }
    }

    mostrarNotificacion(mensaje, tipo = 'info') {
        const notificacion = document.createElement('div');
        notificacion.className = `notification ${tipo}`;
        notificacion.textContent = mensaje;
        
        document.body.appendChild(notificacion);
        
        setTimeout(() => {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }, 3000);
    }
}

// Inicializar cuando el DOM esté listo
let productosManager;
document.addEventListener('DOMContentLoaded', () => {
    productosManager = new ProductosManager();
});

// Hacer disponible globalmente
window.productosManager = productosManager;