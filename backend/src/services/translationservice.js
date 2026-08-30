const NodeCache = require("node-cache");
const { translate } = require('@vitalets/google-translate-api');

// Cache for 24 hours (86400 seconds)
const myCache = new NodeCache({ stdTTL: 86400 });

const translateTextService = async (text, targetLanguage) => {
    const cacheKey = `trans_${targetLanguage}_${text}`;

    if (myCache.has(cacheKey)) {
        console.log(`[TRANSLATE-SERVICE] Success (Served from CACHE) -- ${text.length} chars to ${targetLanguage}`);
        return { translatedText: myCache.get(cacheKey) };
    }

    const result = await translate(text, { to: targetLanguage });
    console.log(`[TRANSLATE-SERVICE] Success (Fetched from API) -- ${text.length} chars translated to ${targetLanguage}`);

    myCache.set(cacheKey, result.text);

    return { translatedText: result.text };
};

module.exports = { translateTextService };