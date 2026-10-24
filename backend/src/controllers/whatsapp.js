// File: src/controllers/whatsappController.js (ya aapka jo bhi controller ho)

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
    redirectWhatsApp
};