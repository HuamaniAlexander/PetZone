// Sistema de gestión del carrito de compras

// Actualizar contador del carrito en el navbar
async function actualizarContadorCarrito() {
    try {
        const response = await API.get('carrito.php?action=count');
        const count = response.data.count || 0;
        
        const cartBadge = document.getElementById('cart-count');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error al actualizar contador:', error);
    }
}

// Agregar producto al carrito
async function agregarAlCarrito(productoId, nombre, precio, cantidad = 1) {
    try {
        const response = await API.post('carrito.php', {
            producto_id: productoId,
            cantidad: cantidad,
            precio_unitario: precio
        });
        
        // Actualizar contador
        await actualizarContadorCarrito();
        
        // Mostrar notificación
        mostrarNotificacion(`✓ ${nombre} agregado al carrito`, 'success');
        
        return response;
    } catch (error) {
        mostrarNotificacion('Error al agregar producto', 'error');
        console.error('Error:', error);
    }
}

// Cargar contenido del carrito (para página carrito.html)
async function cargarCarrito() {
    try {
        const response = await API.get('carrito.php');
        const { items, total, count } = response.data;
        
        renderizarCarrito(items, total, count);
        
    } catch (error) {
        console.error('Error al cargar carrito:', error);
    }
}

// Renderizar items del carrito
function renderizarCarrito(items, total, count) {
    const container = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    const emptyMessage = document.getElementById('empty-cart-message');
    
    if (!container) return;
    
    // Si no hay items
    if (items.length === 0) {
        if (emptyMessage) emptyMessage.style.display = 'block';
        container.innerHTML = '';
        if (totalElement) totalElement.textContent = 'S/ 0.00';
        return;
    }
    
    if (emptyMessage) emptyMessage.style.display = 'none';
    
    // Renderizar items
    container.innerHTML = '';
    items.forEach(item => {
        const itemHTML = `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item__image">
                    <img src="../IMG/Productos/${item.imagen}" alt="${item.nombre}">
                </div>
                <div class="cart-item__info">
                    <h3 class="cart-item__name">${item.nombre}</h3>
                    <p class="cart-item__description">${item.descripcion}</p>
                    <p class="cart-item__price">S/ ${parseFloat(item.precio_unitario).toFixed(2)}</p>
                </div>
                <div class="cart-item__quantity">
                    <button class="qty-btn" onclick="cambiarCantidad(${item.id}, ${item.cantidad - 1})">−</button>
                    <input type="number" value="${item.cantidad}" min="1" max="${item.stock}" 
                           onchange="cambiarCantidad(${item.id}, this.value)" readonly>
                    <button class="qty-btn" onclick="cambiarCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                </div>
                <div class="cart-item__subtotal">
                    <p>S/ ${(item.cantidad * item.precio_unitario).toFixed(2)}</p>
                </div>
                <button class="cart-item__remove" onclick="eliminarDelCarrito(${item.id})">
                    <span class="material-icons">delete</span>
                </button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });
    
    // Actualizar total
    if (totalElement) {
        totalElement.textContent = `S/ ${parseFloat(total).toFixed(2)}`;
    }
}

// Cambiar cantidad de un item
async function cambiarCantidad(itemId, nuevaCantidad) {
    if (nuevaCantidad < 0) return;
    
    try {
        await API.put('carrito.php', {
            id: itemId,
            cantidad: parseInt(nuevaCantidad)
        });
        
        // Recargar carrito
        await cargarCarrito();
        await actualizarContadorCarrito();
        
    } catch (error) {
        mostrarNotificacion('Error al actualizar cantidad', 'error');
        console.error('Error:', error);
    }
}

// Eliminar item del carrito
async function eliminarDelCarrito(itemId) {
    if (!confirm('¿Eliminar este producto del carrito?')) return;
    
    try {
        await API.delete('carrito.php', { id: itemId });
        
        mostrarNotificacion('Producto eliminado', 'success');
        
        // Recargar carrito
        await cargarCarrito();
        await actualizarContadorCarrito();
        
    } catch (error) {
        mostrarNotificacion('Error al eliminar producto', 'error');
        console.error('Error:', error);
    }
}

// Vaciar carrito completo
async function vaciarCarrito() {
    if (!confirm('¿Estás seguro de vaciar todo el carrito?')) return;
    
    try {
        await API.delete('carrito.php', { clear: true });
        
        mostrarNotificacion('Carrito vaciado', 'success');
        
        await cargarCarrito();
        await actualizarContadorCarrito();
        
    } catch (error) {
        mostrarNotificacion('Error al vaciar carrito', 'error');
        console.error('Error:', error);
    }
}

// Proceder al checkout
function procederAlCheckout() {
    window.location.href = 'checkout.html';
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification--${tipo}`;
    notification.innerHTML = `
        <span class="notification__icon">${tipo === 'success' ? '✓' : '✕'}</span>
        <span class="notification__message">${mensaje}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar animación
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    // Actualizar contador en todas las páginas
    actualizarContadorCarrito();
    
    // Si estamos en la página del carrito, cargar items
    if (document.getElementById('cart-items')) {
        cargarCarrito();
    }
});