const NodeCache = require("node-cache");
// Cache for 24 hours (86400 seconds)
const myCache = new NodeCache({ stdTTL: 86400 });

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

        // 1. CACHE LOGIC: Ek unique key banayenge
        const cacheKey = `trans_${targetLanguage}_${text}`;

        // 2. CACHE CHECK: Agar pehle se yaad hai, toh seedha yahin se bhej do (No API Call!)
        if (myCache.has(cacheKey)) {
            console.log(`[TRANSLATE] Success (Served from CACHE) -- ${text.length} chars to ${targetLanguage}`);
            return res.status(200).json({
                success: true,
                originalText: text,
                translatedText: myCache.get(cacheKey) 
            });
        }

        // 3. Agar pehli baar aaya hai, tabhi API call chalegi
        const result = await translate(text, { to: targetLanguage });
        console.log(`[TRANSLATE] Success (Fetched from API) -- ${text.length} chars translated to ${targetLanguage}`);

        // 4. API se data aane ke baad CACHE mein Save kar do
        myCache.set(cacheKey, result.text);

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