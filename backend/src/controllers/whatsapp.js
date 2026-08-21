const redirectWhatsApp = (req, res) => {
    try {
        // BACKEND HARDCODE: Yeh 100% secure hai kyunki ye server par chal raha hai.
        // Hacker isko 'Inspect Element' karke kabhi nahi dekh sakta.
        // Niche "919876543210" ki jagah apna asli WhatsApp number daal do.
        const phoneNumber = "919530060288"; 

        // Frontend se jo message aaya hai usko uthao
        const message = req.query.text || ''; 
        
        // WhatsApp ka final link banao
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
        
        // User ko seedha WhatsApp par phek do (Redirect)
        res.redirect(whatsappUrl);
    } catch (error) {
        console.error("[WhatsApp API] Error:", error);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    redirectWhatsApp
};