// Note: this package requires named import (curly braces) in newer versions.
const { translate } = require('@vitalets/google-translate-api');

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

        const result = await translate(text, { to: targetLanguage });
        console.log(`[TRANSLATE] Success -- ${text.length} chars translated to ${targetLanguage}`);

        return res.status(200).json({
            success: true,
            originalText: text,
            translatedText: result.text
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