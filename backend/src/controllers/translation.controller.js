// FIXED: import ko aise curly braces {} mein lena padta hai naye version mein
const { translate } = require('@vitalets/google-translate-api'); 

const translatetext = async (req, res) => {
    try {
        const { text, targetLanguage } = req.body; 

        if (!text || !targetLanguage) {
            return res.status(400).json({
                success: false,
                message: "Please provide both 'text' and 'targetLanguage'"
            });
        }

        // Translation API call (yeh ab theek se chalega)
        const result = await translate(text, { to: targetLanguage });

        return res.status(200).json({
            success: true,
            originalText: text,
            translatedText: result.text 
        });

    } catch (error) {
        console.error("Translate API Error:", error);
        return res.status(500).json({
            success: false,
            message: "Server failed to translate text",
            error: error.message
        });
    }
};

module.exports = { translatetext };