// Sistema de Checkout

let carritoData = null;

// Cargar datos del carrito al iniciar
document.addEventListener('DOMContentLoaded', async function() {
    await cargarResumenCarrito();
    configurarFormulario();
});

// Cargar resumen del carrito
async function cargarResumenCarrito() {
    try {
        const response = await API.get('carrito.php');
        carritoData = response.data;
        
        if (!carritoData.items || carritoData.items.length === 0) {
            // Redirigir si el carrito está vacío
            window.location.href = 'carrito.html';
            return;
        }
        
        renderizarResumen(carritoData);
        
    } catch (error) {
        console.error('Error al cargar carrito:', error);
        mostrarError('Error al cargar el carrito');
    }
}

// Renderizar resumen del pedido
function renderizarResumen(data) {
    const itemsContainer = document.getElementById('resumen-items');
    const subtotalElement = document.getElementById('resumen-subtotal');
    const totalElement = document.getElementById('resumen-total');
    
    if (!itemsContainer) return;
    
    // Renderizar items
    itemsContainer.innerHTML = '';
    data.items.forEach(item => {
        const itemHTML = `
            <div class="resumen__item">
                <div class="resumen__item-info">
                    <div class="resumen__item-nombre">${item.nombre}</div>
                    <div class="resumen__item-cantidad">Cantidad: ${item.cantidad}</div>
                </div>
                <div class="resumen__item-precio">
                    S/ ${(item.cantidad * item.precio_unitario).toFixed(2)}
                </div>
            </div>
        `;
        itemsContainer.insertAdjacentHTML('beforeend', itemHTML);
    });
    
    // Actualizar totales
    const subtotal = parseFloat(data.total);
    const envio = 0; // Envío gratis
    const total = subtotal + envio;
    
    if (subtotalElement) subtotalElement.textContent = `S/ ${subtotal.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `S/ ${total.toFixed(2)}`;
}

// Configurar formulario
function configurarFormulario() {
    const form = document.getElementById('checkout-form');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validarFormulario()) {
            return;
        }
        
        await procesarPedido();
    });
    
    // Configurar selección de método de pago
    const paymentOptions = document.querySelectorAll('.payment__option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            paymentOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
}

// Validar formulario
function validarFormulario() {
    let esValido = true;
    
    // Validar campos requeridos
    const camposRequeridos = document.querySelectorAll('[required]');
    camposRequeridos.forEach(campo => {
        if (!campo.value.trim()) {
            campo.classList.add('error');
            esValido = false;
        } else {
            campo.classList.remove('error');
        }
    });
    
    // Validar email
    const email = document.getElementById('email');
    if (email && email.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value)) {
            email.classList.add('error');
            esValido = false;
        }
    }
    
    // Validar teléfono
    const telefono = document.getElementById('telefono');
    if (telefono && telefono.value) {
        const telefonoRegex = /^[0-9]{9}$/;
        if (!telefonoRegex.test(telefono.value)) {
            telefono.classList.add('error');
            esValido = false;
        }
    }
    
    // Validar método de pago
    const metodoPago = document.querySelector('input[name="metodo_pago"]:checked');
    if (!metodoPago) {
        mostrarError('Por favor selecciona un método de pago');
        esValido = false;
    }
    
    if (!esValido) {
        mostrarError('Por favor completa todos los campos requeridos');
    }
    
    return esValido;
}

// Procesar pedido
async function procesarPedido() {
    const botonPagar = document.getElementById('btn-pagar');
    if (botonPagar) {
        botonPagar.disabled = true;
        botonPagar.textContent = 'Procesando...';
    }
    
    try {
        // Recopilar datos del formulario
        const formData = {
            // Datos del cliente
            nombre: document.getElementById('nombre').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            
            // Dirección
            direccion: document.getElementById('direccion').value,
            ciudad: document.getElementById('ciudad').value,
            distrito: document.getElementById('distrito').value,
            referencia: document.getElementById('referencia').value,
            
            // Método de pago
            metodo_pago: document.querySelector('input[name="metodo_pago"]:checked').value,
            
            // Items del carrito
            items: carritoData.items,
            
            // Totales
            subtotal: carritoData.total,
            total: carritoData.total
        };
        
        // Enviar pedido
        const response = await API.post('pedidos.php', formData);
        
        // Mostrar confirmación
        mostrarConfirmacion(response.data.numero_pedido);
        
        // Vaciar carrito
        await API.delete('carrito.php', { clear: true });
        
    } catch (error) {
        console.error('Error al procesar pedido:', error);
        mostrarError('Error al procesar el pedido. Por favor intenta nuevamente.');
        
        if (botonPagar) {
            botonPagar.disabled = false;
            botonPagar.textContent = 'Confirmar Pedido';
        }
    }
}

// Mostrar confirmación
function mostrarConfirmacion(numeroPedido) {
    // Ocultar formulario
    const form = document.getElementById('checkout-form');
    const resumen = document.querySelector('.checkout__resumen');
    
    if (form) form.style.display = 'none';
    if (resumen) resumen.style.display = 'none';
    
    // Mostrar mensaje de confirmación
    const confirmacion = document.getElementById('confirmacion');
    const numeroPedidoElement = document.getElementById('numero-pedido');
    
    if (confirmacion) {
        confirmacion.classList.add('show');
    }
    
    if (numeroPedidoElement) {
        numeroPedidoElement.textContent = numeroPedido;
    }
    
    // Actualizar contador del carrito
    const cartBadge = document.getElementById('cart-count');
    if (cartBadge) {
        cartBadge.textContent = '0';
        cartBadge.style.display = 'none';
    }
}

// Mostrar error
function mostrarError(mensaje) {
    const notification = document.createElement('div');
    notification.className = 'notification notification--error';
    notification.innerHTML = `
        <span class="notification__icon">✕</span>
        <span class="notification__message">${mensaje}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Volver al inicio
function volverAlInicio() {
    window.location.href = '../index.html';
}

// Ver pedido (función placeholder)
function verPedido() {
    alert('Función de seguimiento de pedido en desarrollo.\nRecibirás un email con los detalles de tu pedido.');
    volverAlInicio();
}