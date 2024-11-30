const checkVideoStatus = async () => {
    try {
        // Get API key from environment
        const apiKey = process.env.HEYGEN_API_KEY;
        if (!apiKey) {
            throw new Error('HEYGEN_API_KEY environment variable is not set');
        }

        // Test video ID
        const testVideoId = "test-video-123"; 

        const response = await fetch(`http://localhost:5173/api/video?id=${testVideoId}`, {
            headers: {
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Status check failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Video status response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
};

checkVideoStatus();
