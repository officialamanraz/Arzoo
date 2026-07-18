if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// External rates API -- moved to env var instead of hardcoded URL
const CURRENCY_API_URL = process.env.CURRENCY_API_URL || 'https://fxapi.app/api/INR.json';
const FLAG_CDN_BASE_URL = process.env.FLAG_CDN_BASE_URL || 'https://flagcdn.com/w20';

const currencychange = async (req, res) => {
    console.log(`[CURRENCY] Fetching rates from ${CURRENCY_API_URL}`);

    try {
        const response = await fetch(CURRENCY_API_URL);

        if (!response.ok) {
            throw new Error(`External API failed to load data with status: ${response.status}`);
        }

        const data = await response.json();

        const formattedData = {};

        for (const currencyCode in data.rates) {
            const currentRate = data.rates[currencyCode];

            const countryCode = currencyCode.slice(0, 2).toLowerCase();
            const flagUrl = `${FLAG_CDN_BASE_URL}/${countryCode}.png`;

            formattedData[currencyCode] = {
                rate: currentRate,
                flag: flagUrl
            };
        }

        console.log(`[CURRENCY] Success -- ${Object.keys(formattedData).length} currencies loaded`);
        return res.status(200).json(formattedData);
    } catch (error) {
        console.error('[CURRENCY] Fetch error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'There was a server error while fetching currency rates.',
            error: error.message
        });
    }
};

module.exports = { currencychange };