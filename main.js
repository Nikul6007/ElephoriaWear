/**
 * ELEPHORIA WEAR - Global JavaScript
 * Final Fix: Header/Footer Loader + EmailJS + Firebase Support + User Specific Cart
 */

// 1. Global configuration
const publicKey = "cMV9WHTWRDSeU71Zr";
const serviceId = "service_miq3boi";
const templateId = "template_pj6s40e";
const templateId1 = "template_hvfskjj";

// 2. Initialize EmailJS Immediately
if (typeof emailjs !== 'undefined') {
    emailjs.init(publicKey);
}

// 3. Helper: Dynamic Cart Key (User Based)
function getCartKey() {
    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        return `cart_${firebase.auth().currentUser.uid}`;
    }
    return `cart_guest`;
}

// 4. Global Checkout Function
function checkout(event) {
    if (event) event.preventDefault();
    if (typeof emailjs === 'undefined') { alert("Email service is loading..."); return; }

    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    if (cart.length === 0) { alert('Your cart is empty!'); return; }

    const userEmail = prompt("Please enter your email for confirmation:");
    if (!userEmail) return;

    const phoneNumber = "917046575834";
    const orderId = "ELE-" + Math.floor(Math.random() * 900000 + 100000);

    let subtotal = 0;
    let whatsappMessage = "Hello *ELEPHORIAWEAR*! I would like to place an order:\n\n";
    let orderItemsHtml = "";

    cart.forEach((item, index) => {
        subtotal += item.price * item.quantity;
        whatsappMessage += `${index + 1}. *${item.name}*\n   Qty: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')}\n\n`;
        orderItemsHtml += `<div style="margin-bottom: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;"><strong>${item.name}</strong><br>QTY: ${item.quantity}<br>₹${item.price.toLocaleString('en-IN')}</div>`;
    });

    const gstAmount = Math.round(subtotal * 0.05);
    const finalTotal = subtotal + gstAmount;

    whatsappMessage += `Subtotal: ₹${subtotal.toLocaleString('en-IN')}\nGST (5%): ₹${gstAmount.toLocaleString('en-IN')}\nShipping: FREE\n*Total Amount: ₹${finalTotal.toLocaleString('en-IN')}*\n\n`;
    whatsappMessage += "Please share the screenshot after payment. Thank you!";

    const templateParams = {
        order_id: orderId,
        order_items_html: orderItemsHtml,
        shipping_cost: "FREE",
        tax_cost: `₹${gstAmount.toLocaleString('en-IN')} (5% GST)`,
        order_total: `₹${finalTotal.toLocaleString('en-IN')}`,
        user_email: userEmail
    };

    const btnText = document.querySelector('.whatsapp-btn-text');
    if (btnText) btnText.innerText = "Processing...";

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    emailjs.send(serviceId, templateId1, templateParams)
        .then(() => { window.location.href = whatsappUrl; })
        .catch(() => { window.location.href = whatsappUrl; })
        .finally(() => { if (btnText) btnText.innerText = "Order on WhatsApp"; });
}

// 5. CORE UI LOGIC (IIFE)
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        loadComponents();
        initAddToCartListeners();
        handleSearch();
    });

    async function loadComponents() {
        try {
            const [headerRes, footerRes] = await Promise.all([
                fetch('header.html'),
                fetch('footer.html')
            ]);
            document.body.insertAdjacentHTML('afterbegin', await headerRes.text());
            document.body.insertAdjacentHTML('beforeend', await footerRes.text());

            initNavbarScroll();
            highlightActivePage();
            initContactForm();
            
            // Initial Cart Sync
            initCart();
            
            // Check Firebase Auth State
            checkAuthState(); 
        } catch (err) {
            console.error("Shared components error:", err);
        }
    }

    function checkAuthState() {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged((user) => {
                const loginBtn = document.getElementById('loginNavItem');
                if (user) {
                    if (loginBtn) {
                        loginBtn.innerHTML = `<a class="nav-link" href="#">HELLO, ${user.email.split('@')[0].toUpperCase()}</a>`;
                    }
                }
                // Refresh Cart Badge when user logs in/out
                initCart();
            });
        }
    }

    function initCart() {
        const cartKey = getCartKey();
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        updateCartBadge(cart);
    }

    function initAddToCartListeners() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-add-cart');
            if (!btn) return;
            e.preventDefault();
            const product = {
                id: btn.getAttribute('data-id'),
                name: btn.getAttribute('data-name'),
                price: parseFloat(btn.getAttribute('data-price')),
                quantity: 1,
                image: btn.closest('.image-wrapper')?.querySelector('img')?.src || 'assets/placeholder.png'
            };
            addToCart(product);
            btn.innerHTML = 'ADDED!';
            setTimeout(() => { btn.innerHTML = 'ADD TO CART'; }, 1000);
        });
    }

    function addToCart(product) {
        const cartKey = getCartKey();
        let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const idx = cart.findIndex(item => item.id === product.id);
        idx > -1 ? cart[idx].quantity += 1 : cart.push(product);
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartBadge(cart);
    }

    function updateCartBadge(cart) {
        const badge = document.getElementById('cartBadgeCount');
        if (badge) badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    // Navbar, Search, and Contact logic
    function initNavbarScroll() {
        const navbar = document.getElementById('mainNav');
        if (!navbar) return;
        window.addEventListener('scroll', () => {
            window.scrollY > 50 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled');
        });
    }

    function highlightActivePage() {
        const path = window.location.pathname.split("/").pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            link.getAttribute('href') === path ? link.classList.add('active') : link.classList.remove('active');
        });
    }

    function initContactForm() {
        const contactForm = document.getElementById('contact-form');
        if (!contactForm) return;
        contactForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const btn = this.querySelector('button');
            btn.innerText = 'Sending...';
            emailjs.sendForm(serviceId, templateId, this)
                .then(() => { alert('Message Sent!'); this.reset(); })
                .finally(() => btn.innerText = 'Send Message');
        });
    }

    function handleSearch() {
        const query = new URLSearchParams(window.location.search).get('q');
        if (query && window.location.pathname.includes('shop.html')) {
            document.querySelectorAll('.product-card').forEach(card => {
                const match = card.querySelector('.product-title')?.innerText.toLowerCase().includes(query.toLowerCase());
                card.closest('.col').style.display = match ? 'block' : 'none';
            });
        }
    }
})();