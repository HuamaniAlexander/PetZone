// Gestión dinámica de productos con sistema de cantidad
class ProductosManager {
    constructor() {
        this.todosLosProductos = [];
        this.productosMostrados = 6;
        this.categoriaActual = 'todos';
        this.productGrid = document.getElementById('productGrid');
        this.showMoreBtn = document.getElementById('showMoreBtn');
        this.loadingMessage = document.getElementById('loadingMessage');
        this.cantidades = {}; // Almacena las cantidades seleccionadas
        this.init();
    }

    async init() {
        await this.cargarProductos();
        this.setupEventListeners();
        this.renderizarProductos();
        this.actualizarBotonMostrarMas();
    }

    async cargarProductos(categoria = 'todos') {
        try {
            this.mostrarCargando(true);
            
            const params = categoria !== 'todos' ? { categoria: categoria } : {};
            const response = await API.get('productos.php', params);
            
            if (response.success) {
                this.todosLosProductos = response.data;
                this.categoriaActual = categoria;
                this.productosMostrados = 6;
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            this.mostrarError();
        } finally {
            this.mostrarCargando(false);
        }
    }

    renderizarProductos() {
        if (!this.productGrid) return;

        this.productGrid.innerHTML = '';

        if (this.todosLosProductos.length === 0) {
            this.productGrid.innerHTML = `
                <div class="no-products">
                    <p>No se encontraron productos en esta categoría</p>
                </div>
            `;
            return;
        }

        const productosAMostrar = this.todosLosProductos.slice(0, this.productosMostrados);

        productosAMostrar.forEach(producto => {
            const productoHTML = this.crearProductoHTML(producto);
            this.productGrid.insertAdjacentHTML('beforeend', productoHTML);
        });

        this.setupProductoListeners();
    }

    crearProductoHTML(producto) {
        const cantidad = this.cantidades[producto.id] || 1;
        const stockDisponible = producto.stock > 0;

        return `
            <article class="product" data-category="${producto.categoria}" data-id="${producto.id}">
                <div class="product__image">
                    <img src="${producto.imagen}" alt="${producto.nombre}" class="product__img">
                    ${!stockDisponible ? '<div class="product__badge-out">Agotado</div>' : ''}
                </div>
                <div class="product__info">
                    <h3 class="product__name">${producto.nombre}</h3>
                    <p class="product__description">${producto.descripcion || ''}</p>
                    <div class="product__footer">
                        <span class="product__price">S/. ${parseFloat(producto.precio).toFixed(2)}</span>
                        ${stockDisponible ? `
                            <div class="product__actions">
                                <div class="product__quantity">
                                    <button class="quantity-btn quantity-minus" data-id="${producto.id}">
                                        <span class="material-icons">remove</span>
                                    </button>
                                    <input type="number" 
                                           class="quantity-input" 
                                           data-id="${producto.id}"
                                           value="${cantidad}" 
                                           min="1" 
                                           max="${producto.stock}">
                                    <button class="quantity-btn quantity-plus" data-id="${producto.id}">
                                        <span class="material-icons">add</span>
                                    </button>
                                </div>
                                <button class="product__btn" data-id="${producto.id}">
                                    <span class="material-icons">add_shopping_cart</span>
                                    Agregar
                                </button>
                            </div>
                        ` : '<button class="product__btn product__btn--disabled" disabled>Agotado</button>'}
                    </div>
                    ${stockDisponible && producto.stock <= 5 ? 
                        `<p class="product__stock-warning">¡Solo quedan ${producto.stock} unidades!</p>` 
                        : ''}
                </div>
            </article>
        `;
    }

    setupProductoListeners() {
        // Botones de cantidad -
        this.productGrid.querySelectorAll('.quantity-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(e.currentTarget.dataset.id);
                this.cambiarCantidad(id, -1);
            });
        });

        // Botones de cantidad +
        this.productGrid.querySelectorAll('.quantity-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(e.currentTarget.dataset.id);
                this.cambiarCantidad(id, 1);
            });
        });

        // Inputs de cantidad
        this.productGrid.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                const valor = parseInt(e.currentTarget.value);
                const producto = this.todosLosProductos.find(p => p.id === id);
                
                if (producto) {
                    const nuevaCantidad = Math.max(1, Math.min(valor, producto.stock));
                    this.cantidades[id] = nuevaCantidad;
                    e.currentTarget.value = nuevaCantidad;
                }
            });
        });

        // Botones agregar al carrito
        this.productGrid.querySelectorAll('.product__btn:not(.product__btn--disabled)').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = parseInt(e.currentTarget.dataset.id);
                this.agregarAlCarrito(id);
            });
        });
    }

    cambiarCantidad(productoId, cambio) {
        const producto = this.todosLosProductos.find(p => p.id === productoId);
        if (!producto) return;

        const cantidadActual = this.cantidades[productoId] || 1;
        const nuevaCantidad = Math.max(1, Math.min(cantidadActual + cambio, producto.stock));
        
        this.cantidades[productoId] = nuevaCantidad;
        
        const input = this.productGrid.querySelector(`.quantity-input[data-id="${productoId}"]`);
        if (input) {
            input.value = nuevaCantidad;
        }
    }

    agregarAlCarrito(productoId) {
        const producto = this.todosLosProductos.find(p => p.id === productoId);
        if (!producto) return;

        const cantidad = this.cantidades[productoId] || 1;

        if (window.carritoManager) {
            window.carritoManager.agregarProducto(producto, cantidad);
            // Resetear cantidad después de agregar
            this.cantidades[productoId] = 1;
            const input = this.productGrid.querySelector(`.quantity-input[data-id="${productoId}"]`);
            if (input) {
                input.value = 1;
            }
        }
    }

    setupEventListeners() {
        // Filtros de categoría
        const filterButtons = document.querySelectorAll('.filters__btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                filterButtons.forEach(btn => btn.classList.remove('filters__btn--active'));
                e.currentTarget.classList.add('filters__btn--active');

                const categoria = e.currentTarget.dataset.filter;
                await this.cargarProductos(categoria);
                this.renderizarProductos();
                this.actualizarBotonMostrarMas();
            });
        });

        // Botón mostrar más
        if (this.showMoreBtn) {
            this.showMoreBtn.addEventListener('click', () => {
                this.productosMostrados += 6;
                this.renderizarProductos();
                this.actualizarBotonMostrarMas();
            });
        }
    }

    actualizarBotonMostrarMas() {
        if (!this.showMoreBtn) return;

        if (this.productosMostrados >= this.todosLosProductos.length) {
            this.showMoreBtn.classList.add('catalog__more-btn--hidden');
        } else {
            this.showMoreBtn.classList.remove('catalog__more-btn--hidden');
        }
    }

    mostrarCargando(mostrar) {
        if (this.loadingMessage) {
            this.loadingMessage.style.display = mostrar ? 'flex' : 'none';
        }
        if (this.productGrid) {
            this.productGrid.style.display = mostrar ? 'none' : 'grid';
        }
    }

    mostrarError() {
        if (this.productGrid) {
            this.productGrid.innerHTML = `
                <div class="error-message">
                    <span class="material-icons">error_outline</span>
                    <p>Error al cargar los productos. Por favor, intenta de nuevo.</p>
                </div>
            `;
        }
    }

    // Método para actualizar productos sin recargar página (polling desde dashboard)
    async actualizar() {
        const categoriaActual = this.categoriaActual;
        await this.cargarProductos(categoriaActual);
        this.renderizarProductos();
        this.actualizarBotonMostrarMas();
    }
}

// Inicializar gestor de productos
document.addEventListener('DOMContentLoaded', () => {
    window.productosManager = new ProductosManager();

    // Polling para actualizar productos cada 30 segundos (cambios desde dashboard)
    setInterval(() => {
        if (window.productosManager) {
            window.productosManager.actualizar();
        }
    }, 30000);
});

// Agregar estilos CSS adicionales
const style = document.createElement('style');
style.textContent = `
    .loading-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        grid-column: 1 / -1;
    }

    .loader {
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #23906F;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .product__quantity {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .quantity-btn {
        width: 30px;
        height: 30px;
        border: 2px solid #e0e0e0;
        background: white;
        border-radius: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }

    .quantity-btn:hover {
        background: #23906F;
        border-color: #23906F;
    }

    .quantity-btn:hover .material-icons {
        color: white;
    }

    .quantity-btn .material-icons {
        font-size: 18px;
        color: #666;
    }

    .quantity-input {
        width: 50px;
        height: 30px;
        text-align: center;
        border: 2px solid #e0e0e0;
        border-radius: 5px;
        font-size: 1rem;
        font-weight: 600;
    }

    .quantity-input:focus {
        outline: none;
        border-color: #23906F;
    }

    .product__actions {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .product__btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        width: 100%;
    }

    .product__btn .material-icons {
        font-size: 18px;
    }

    .product__btn--disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .product__badge-out {
        position: absolute;
        top: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        padding: 0.3rem 0.8rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
    }

    .product__stock-warning {
        color: #ff9800;
        font-size: 0.8rem;
        font-weight: 600;
        text-align: center;
        margin-top: 0.5rem;
    }

    .no-products, .error-message {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #666;
    }

    .error-message .material-icons {
        font-size: 4rem;
        color: #ff4444;
        margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
        .product__quantity {
            justify-content: center;
        }
    }
`;
document.head.appendChild(style);