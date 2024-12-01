import { Spiceflow } from 'spiceflow'

import { GenerateRequest, generateVideosHandler } from '~/lib/llm'

export const app = new Spiceflow({ basePath: '/api' }).post(
    '/generate', 
    async function* ({ request: req }) {
        const body = await req.json()
        
        // Check if already generating
        if (globalThis.isGenerating) {
            throw new Error('Already generating videos. Please wait for the current generation to complete.')
        }

        try {
            globalThis.isGenerating = true
            yield* await generateVideosHandler(body, req.signal)
        } finally {
            globalThis.isGenerating = false
        }
    },
    {
        body: GenerateRequest,
        // response: GenerateResponse,
    },
)


export type App = typeof app

export const action = async ({ request }: { request: Request }) => {
    return app.handle(request)
}

export const loader = async ({ request }: { request: Request }) => {
    return app.handle(request)
}
