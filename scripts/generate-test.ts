const generateVideo = async () => {
    try {
        // Get API key from environment
        const apiKey = process.env.HEYGEN_API_KEY
        if (!apiKey) {
            throw new Error('HEYGEN_API_KEY environment variable is not set')
        }

        const checkTemplates = true

        if (checkTemplates) {
            // Fetch available templates
            const templatesResponse = await fetch(
                'https://api.heygen.com/v2/templates',
                {
                    headers: {
                        // 'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                    },
                },
            )

            if (!templatesResponse.ok) {
                throw new Error(
                    `Failed to fetch templates: ${templatesResponse.statusText}`,
                )
            }

            const templates = await templatesResponse.json()
            console.log(
                'Available templates:',
                JSON.stringify(templates, null, 2),
            )
        }
        const response = await fetch('http://localhost:5173/api/generate', {
            method: 'POST',
            headers: {
                accept: 'application/json',

                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                script: 'Ciao! come va amici?',
                title: 'Test Video',
            }),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(
                `API request failed: ${response.statusText}\n${errorText}`,
            )
        }

        const data = await response.json()
        console.log('Video generation started:', data)

        // Poll for video status
        const checkStatus = async () => {
            const statusResponse = await fetch(
                `http://localhost:5173/api/video?id=${data.id}`,
            )
            const statusData = await statusResponse.json()

            console.log('Video status:', statusData)

            if (statusData.status === 'completed') {
                console.log('Video URL:', statusData.url)
                return
            }
            setTimeout(checkStatus, 5000)
        }
    } catch (error) {
        console.error('Error:', error)
    }
}

generateVideo()
