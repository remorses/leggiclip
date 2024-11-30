import { Spiceflow } from 'spiceflow'

import { GenerateRequest, generateVideosHandler } from '~/lib/llm'


export const app = new Spiceflow({ basePath: '/api' }).post(
    '/generate',
    async function* ({ request: req }) {
        const body = await req.json()

        yield* await generateVideosHandler(body)
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
