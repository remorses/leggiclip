const generateVideo = async () => {
    try {
        const response = await fetch('http://localhost:3000/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                script: "Hello! This is a test video generated via the API.",
                title: "Test Video"
            })
        });

        if (!response.ok) {
            throw new Error(`Generation failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Video generation started:', data);

        // Poll for video status
        const checkStatus = async () => {
            const statusResponse = await fetch(`http://localhost:3000/api/video?id=${data.id}`);
            const statusData = await statusResponse.json();
            
            console.log('Video status:', statusData.status);
            
            if (statusData.status === 'completed') {
                console.log('Video URL:', statusData.url);
            } else if (statusData.status !== 'failed') {
                // Check again in 5 seconds
                setTimeout(checkStatus, 5000);
            }
        };

        await checkStatus();

    } catch (error) {
        console.error('Error:', error);
    }
};

generateVideo();
