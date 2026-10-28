// File: src/controllers/whatsappController.js (ya aapka jo bhi controller ho)
// Apne controller ya jahan aap signup/order handle karte hain, wahan ye code daal dein:

const API_BASE_URL = process.env.VITE_API_URL || "https://arzoo-abjn.onrender.com"; // ya aapka backend URL

// 🌐 1. Free WhatsApp Notification Function (Directly included)
const sendFreeWhatsAppNotification = async (message) => {
    // Apna phone number country code ke sath dalein (jaise: 919876543210 bina '+' ke)
    const phoneNumber = "919530060288"; 
    // Jo API key aapko WhatsApp par mili hai wo yahan dalein
    const apiKey = "YOUR_CALLMEBOT_API_KEY"; 

    try {
        const encodedMessage = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodedMessage}&apikey=${apiKey}`;

        const response = await fetch(url);
        if (response.ok) {
            console.log("[WHATSAPP] Free notification sent successfully!");
        } else {
            console.error("[WHATSAPP] Failed to send notification");
        }
    } catch (err) {
        console.error("[WHATSAPP] Error:", err.message);
    }
};


// 👤 2. Signup Controller Example
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // --- Aapka database save logic yahan hoga ---
        // const newUser = await db.execute(...);

        // ✅ Signup hone ke baad WhatsApp notification bhejein
        await sendFreeWhatsAppNotification(
            `👤 *New User Signup!*\n\n• Name: ${name}\n• Email: ${email}`
        );

        return res.status(201).json({ success: true, message: "User registered successfully!" });
    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};


// 🛍️ 3. Order Placement Controller Example
const placeOrder = async (req, res) => {
    try {
        const { order_id, customer_name, total_amount } = req.body;

        // --- Aapka order save logic yahan hoga ---
        // const newOrder = await db.execute(...);

        // ✅ Order place hone ke baad WhatsApp notification bhejein
        await sendFreeWhatsAppNotification(
            `🛍️ *New Order Received!*\n\n• Order ID: #${order_id}\n• Customer: ${customer_name}\n• Total: ₹${total_amount}`
        );

        return res.status(200).json({ success: true, message: "Order placed successfully!" });
    } catch (err) {
        console.error("Order error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

const redirectWhatsApp = (req, res) => {
    try {
        // Yahan aap apna primary ya naya WhatsApp number daal sakte hain (Country code ke sath, bina '+' ke)
        const phoneNumber = "919166293202"; 

        // Frontend ya query se ane wale parameters ko extract karein
        const productName = req.query.product || 'Arzoo Saree';
        const productPrice = req.query.price || '';
        const productImage = req.query.image || '';
        const customText = req.query.text || '';

        // Ek clean aur readable message format banayein taaki admin/dealer ko 
        // link kholne ki zaroorat na pade aur sab kuch turant dikh jaye.
        let formattedMessage = `Hello! I am inquiring about this product:\n\n`;
        formattedMessage += `🛍️ *Product:* ${productName}\n`;
        if (productPrice) {
            formattedMessage += `💰 *Price:* ${productPrice}\n`;
        }
        if (productImage) {
            formattedMessage += `🖼️ *Image Link:* ${productImage}\n`;
        }
        if (customText) {
            formattedMessage += `\n📝 *Details:* ${customText}\n`;
        }

        // URL encode karein taaki spaces aur emojis properly format ho jayein
        const encodedMessage = encodeURIComponent(formattedMessage);
        
        // WhatsApp ka final link banao
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        // User ko WhatsApp par redirect karein
        res.redirect(whatsappUrl);
    } catch (error) {
        console.error("[WhatsApp API] Error:", error);
        res.status(500).send("Server Error");
    }
};


module.exports = {
    redirectWhatsApp,
    sendFreeWhatsAppNotification,
    registerUser,
    placeOrder
};