const checkTemplate = async () => {
    try {
        // Get API key from environment
        const apiKey = process.env.HEYGEN_API_KEY;
        if (!apiKey) {
            throw new Error('HEYGEN_API_KEY environment variable is not set');
        }

        const templateId = '3d88fbeeccd84c1193d4009bf11eb5f1'; // Using template ID from api.generate.tsx

        const response = await fetch(`https://api.heygen.com/v2/template/${templateId}`, {
            headers: {
                // 'accept': 'application/json',
                'Content-Type': 'application/json',

                'x-api-key': apiKey
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Template details:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
};

checkTemplate();
