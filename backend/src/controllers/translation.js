const { translateTextService } = require('../services/translationservice'); // adjust path

const translatetext = async (req, res) => {
    const { text, targetLanguage } = req.body;
    console.log(`[TRANSLATE] Request -- targetLanguage: ${targetLanguage}, textLength: ${text ? text.length : 0}`);

    try {
        if (!text || !targetLanguage) {
            console.warn('[TRANSLATE] Failed -- missing text or targetLanguage');
            return res.status(400).json({
                success: false,
                message: "Please provide both 'text' and 'targetLanguage'"
            });
        }

        const { translatedText } = await translateTextService(text, targetLanguage);

        return res.status(200).json({
            success: true,
            originalText: text,
            translatedText
        });

    } catch (error) {
        console.error(`[TRANSLATE] Error (targetLanguage: ${targetLanguage}):`, error.message);
        return res.status(500).json({
            success: false,
            message: 'Server failed to translate text',
            error: error.message
        });
    }
};

module.exports = { translatetext };