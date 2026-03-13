/**
 * ELEPHORIA WEAR - Global JavaScript
 * Organized with Scope Protection & Global Access for Checkout
 */

// Global configuration (IIFE ni bahar rakho jethi badhe access thay)
const publicKey = "cMV9WHTWRDSeU71Zr";
const serviceId = "service_miq3boi";
const templateId = "template_pj6s40e";
const templateId1 = "template_hvfskjj";

// 1. Initialize EmailJS Immediately
if (typeof emailjs !== 'undefined') {
    emailjs.init(publicKey);
}

// Global Checkout Function (HTML na onclick mate bahar hovi joie)
function checkout(event) {
    if (event) event.preventDefault();

    if (typeof emailjs === 'undefined') {
        alert("Email service is loading, please try again.");
        return;
    }

    const cart = JSON.parse(localStorage.getItem('elephoria_cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    const userEmail = prompt("Please enter your email for confirmation:");
    if (!userEmail) return;

    const phoneNumber = "917046575834";
    const upiId = "7046575834@upi";
    const orderId = "ELE-" + Math.floor(Math.random() * 900000 + 100000);

    let subtotal = 0;
    let whatsappMessage = "Hello *ELEPHORIAWEAR*! I would like to place an order:\n\n";
    let orderItemsHtml = "";

    cart.forEach((item, index) => {
        subtotal += item.price * item.quantity;
        whatsappMessage += `${index + 1}. *${item.name}*\n   Qty: ${item.quantity} x ₹${item.price.toLocaleString('en-IN')}\n\n`;
        orderItemsHtml += `
            <div style="margin-bottom: 15px; border-bottom: 1px solid #f0f0f0; padding-bottom: 10px;">
                <strong>${item.name}</strong><br>
                QTY: ${item.quantity}<br>
                ₹${item.price.toLocaleString('en-IN')}
            </div>`;
    });
    const gstAmount = Math.round(subtotal * 0.05); // 5% GST
    const finalTotal = subtotal + gstAmount;

    whatsappMessage += `Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n`;
    whatsappMessage += `GST (5%): ₹${gstAmount.toLocaleString('en-IN')}\n`;
    whatsappMessage += `*Total Amount: ₹${finalTotal.toLocaleString('en-IN')}*\n\n`;

    whatsappMessage += `*Payment Details:*\nUPI ID: *7046575834@upi*\n\n`;
    whatsappMessage += "Please share the screenshot after payment. Thank you!";

    const templateParams = {
        order_id: orderId,
        order_items_html: orderItemsHtml,
        shipping_cost: "₹0.00",
        tax_cost: `₹${gstAmount.toLocaleString('en-IN')} (5% GST)`, // Dynamic GST
        order_total: `₹${finalTotal.toLocaleString('en-IN')}`,
        user_email: userEmail
    };

    // Feedback visual
    const btnText = document.querySelector('.whatsapp-btn-text');
    if (btnText) btnText.innerText = "Processing...";

    // --- WHATSAPP URL PEHLA PREPARE KARI LO ---
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    emailjs.send(serviceId, templateId1, templateParams)
        .then(() => {
            console.log("Email Sent Successfully!");
            // CHANGE: window.open ni jagyae window.location.href vapro
            window.location.href = whatsappUrl;
        })
        .catch((error) => {
            console.error("Email Error:", error);
            // CHANGE: Fail thay to pan redirect thavu ja joie
            window.location.href = whatsappUrl;
        })
        .finally(() => {
            if (btnText) btnText.innerText = "Order on WhatsApp";
        });
}

// Baki nu logic IIFE ma rakho jethi global namespace clean rahe
(function () {
    document.addEventListener('DOMContentLoaded', () => {
        loadComponents();
        initCart();
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
            updateCartBadge(JSON.parse(localStorage.getItem('elephoria_cart')) || []);
        } catch (err) {
            console.error("Shared components error:", err);
        }
    }

    function initNavbarScroll() {
        const navbar = document.getElementById('mainNav');
        if (!navbar) return;
        const onScroll = () => {
            window.scrollY > 50 ? navbar.classList.add('scrolled') : navbar.classList.remove('scrolled');
        };
        window.addEventListener('scroll', onScroll);
        onScroll();
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
            const originalText = btn.innerText;
            btn.innerText = 'Sending...';

            emailjs.sendForm(serviceId, templateId, this)
                .then(() => {
                    alert('Message Sent!');
                    this.reset();
                })
                .catch((error) => console.error('EmailJS Error:', error))
                .finally(() => btn.innerText = originalText);
        });
    }

    function initCart() {
        updateCartBadge(JSON.parse(localStorage.getItem('elephoria_cart')) || []);
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
            const originalText = btn.innerHTML;
            btn.innerHTML = 'ADDED!';
            btn.classList.add('bg-dark', 'text-white');
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.remove('bg-dark', 'text-white');
            }, 1000);
        });
    }

    function addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('elephoria_cart')) || [];
        const idx = cart.findIndex(item => item.id === product.id);
        idx > -1 ? cart[idx].quantity += 1 : cart.push(product);
        localStorage.setItem('elephoria_cart', JSON.stringify(cart));
        updateCartBadge(cart);
    }

    function updateCartBadge(cart) {
        const badge = document.getElementById('cartBadgeCount');
        if (!badge) return;
        badge.innerText = cart.reduce((sum, item) => sum + item.quantity, 0);
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
