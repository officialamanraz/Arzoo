// controllers/whatsappController.js

const redirectWhatsApp = (req, res) => {
    try {
        // Backend .env se number nikalna
        const phoneNumber = process.env.WHATSAPP_NUMBER; 
        
        if (!phoneNumber) {
            console.error("[WhatsApp API] Number missing in .env");
            return res.status(500).send("WhatsApp service is currently unavailable.");
        }

        // Frontend se aane wala encoded message
        const message = req.query.text || ''; 
        
        // Final secure URL banana
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        
        // User ko redirect karna
        res.redirect(whatsappUrl);
    } catch (error) {
        console.error("[WhatsApp API] Error:", error);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    redirectWhatsApp
};