// FUNCIONALIDAD PÁGINA PRODUCTOS CON AJAX Y CARRITO

document.addEventListener('DOMContentLoaded', async function() {
    const filterButtons = document.querySelectorAll('.filters__btn');
    const productGrid = document.getElementById('productGrid');
    const showMoreBtn = document.getElementById('showMoreBtn');
    
    let todosLosProductos = [];
    let productosMostrados = 6;
    let cantidadesSeleccionadas = {}; // Objeto para almacenar cantidades por producto
    
    // Cargar productos al iniciar
    await cargarProductos();
    
    // FILTRADO DE PRODUCTOS
    filterButtons.forEach(button => {
        button.addEventListener('click', async function() {
            // Actualizar botón activo
            filterButtons.forEach(btn => btn.classList.remove('filters__btn--active'));
            this.classList.add('filters__btn--active');
            
            const filterValue = this.getAttribute('data-filter');
            
            // Cargar productos filtrados por AJAX
            await cargarProductos(filterValue);
            productosMostrados = 6;
            actualizarBotonMostrarMas();
        });
    });
    
    // BOTÓN MOSTRAR MÁS
    if (showMoreBtn) {
        showMoreBtn.addEventListener('click', function() {
            productosMostrados += 6;
            renderizarProductos();
            actualizarBotonMostrarMas();
        });
    }
    
    // FUNCIÓN PARA CARGAR PRODUCTOS POR AJAX
    async function cargarProductos(categoria = 'todos') {
        try {
            // Mostrar loading
            if (productGrid) {
                productGrid.innerHTML = '<p style="text-align: center; width: 100%;">Cargando productos...</p>';
            }
            
            // Petición AJAX
            const params = categoria !== 'todos' ? { categoria: categoria } : {};
            const response = await API.get('productos.php', params);
            
            todosLosProductos = response.data;
            renderizarProductos();
            
        } catch (error) {
            if (productGrid) {
                productGrid.innerHTML = '<p style="text-align: center; width: 100%; color: red;">Error al cargar productos</p>';
            }
            console.error('Error:', error);
        }
    }
    
    // FUNCIÓN PARA RENDERIZAR PRODUCTOS
    function renderizarProductos() {
        if (!productGrid) return;
        
        productGrid.innerHTML = '';
        
        const productosAMostrar = todosLosProductos.slice(0, productosMostrados);
        
        productosAMostrar.forEach(producto => {
            // Inicializar cantidad si no existe
            if (!cantidadesSeleccionadas[producto.id]) {
                cantidadesSeleccionadas[producto.id] = 1;
            }
            
            const productoHTML = `
                <article class="product" data-category="${producto.categoria}" data-id="${producto.id}">
                    <div class="product__image">
                        <img src="../IMG/Productos/${producto.imagen}" alt="${producto.nombre}" class="product__img">
                    </div>
                    <div class="product__info">
                        <h3 class="product__name">${producto.nombre}</h3>
                        <p class="product__description">${producto.descripcion}</p>
                        <div class="product__footer">
                            <span class="product__price">S/ ${parseFloat(producto.precio).toFixed(2)}</span>
                            
                            <!-- Control de cantidad -->
                            <div class="product__quantity">
                                <button class="qty-btn qty-btn--minus" data-id="${producto.id}">−</button>
                                <input type="number" 
                                       value="${cantidadesSeleccionadas[producto.id]}" 
                                       min="1" 
                                       max="${producto.stock}" 
                                       class="qty-input"
                                       data-id="${producto.id}"
                                       readonly>
                                <button class="qty-btn qty-btn--plus" data-id="${producto.id}">+</button>
                            </div>
                            
                            <button class="product__btn" data-id="${producto.id}">
                                <span class="material-icons">add_shopping_cart</span>
                                Agregar
                            </button>
                        </div>
                    </div>
                </article>
            `;
            productGrid.insertAdjacentHTML('beforeend', productoHTML);
        });
        
        // Event listeners para controles de cantidad
        document.querySelectorAll('.qty-btn--minus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (cantidadesSeleccionadas[id] > 1) {
                    cantidadesSeleccionadas[id]--;
                    actualizarCantidadVisual(id);
                }
            });
        });
        
        document.querySelectorAll('.qty-btn--plus').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const producto = todosLosProductos.find(p => p.id == id);
                if (producto && cantidadesSeleccionadas[id] < producto.stock) {
                    cantidadesSeleccionadas[id]++;
                    actualizarCantidadVisual(id);
                }
            });
        });
        
        // Event listeners para botones de agregar al carrito
        document.querySelectorAll('.product__btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const productoId = this.getAttribute('data-id');
                const producto = todosLosProductos.find(p => p.id == productoId);
                const cantidad = cantidadesSeleccionadas[productoId] || 1;
                
                if (producto) {
                    await agregarAlCarrito(
                        producto.id,
                        producto.nombre,
                        producto.precio,
                        cantidad
                    );
                    
                    // Resetear cantidad a 1 después de agregar
                    cantidadesSeleccionadas[productoId] = 1;
                    actualizarCantidadVisual(productoId);
                }
            });
        });
    }
    
    // Actualizar cantidad visual
    function actualizarCantidadVisual(productoId) {
        const input = document.querySelector(`.qty-input[data-id="${productoId}"]`);
        if (input) {
            input.value = cantidadesSeleccionadas[productoId];
        }
    }
    
    // ACTUALIZAR BOTÓN MOSTRAR MÁS
    function actualizarBotonMostrarMas() {
        if (!showMoreBtn) return;
        
        if (productosMostrados >= todosLosProductos.length) {
            showMoreBtn.classList.add('catalog__more-btn--hidden');
        } else {
            showMoreBtn.classList.remove('catalog__more-btn--hidden');
        }
    }
});