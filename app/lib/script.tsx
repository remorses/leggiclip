import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { extractTagsArrays } from '~/lib/xml'

const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
})

export async function* generateTikTokScripts({
    lawText,
    description,
    numItems = 1,
}: {
    lawText: string
    description: string
    numItems?: number
}) {
    const prompt = `Analyze the law text and generate ${numItems} concise 60-second educational video scripts about: ${description}

Law text:
<law_text>
${lawText}
</law_text>

First, explain how you'll structure each 60-second video using this simplified hero's journey framework:
1. The Call (10s): Present a common situation where this law becomes relevant
2. The Threshold (10s): Show what happens when someone encounters this legal requirement
3. The Journey (15s): Walk through understanding and adapting to the law
4. The Boons (15s): Highlight the key learnings and practical tips
5. The Impact (10s): Demonstrate how following this law creates positive outcomes

Then, provide exactly ${numItems} sets of responses in XML format, each containing:
<video_script>Clear, direct script that follows the hero framework and fits within 60 seconds. Focus on education and practical application.</video_script>
<keywords>At least 10 comma-separated search terms for background footage that matches the script timeline. Each term will be used to find relevant video clips.</keywords>
<title>An informative title that captures the key learning</title>

Example output for one set:
<video_script>A driver approaches an unfamiliar road. The speed limit shows 55, but heavy rain is falling.

The law demands more than following posted limits - it requires judgment based on conditions.

Let's master the key factors:
- Weather reduces visibility and traction
- Traffic density affects safe spacing
- Road conditions determine stopping distance

Research proves that adaptive speeds:
- Cut accident risk by half
- Save lives in adverse conditions
- Protect all road users

This knowledge transforms us from rule-followers into responsible drivers who make our roads safer for everyone.</video_script>
<keywords>rainy road view, speed limit sign, wet braking demonstration, traffic flow diagram, road condition analysis, accident prevention chart, visibility comparison, safe following distance, road safety statistics, community impact graphic</keywords>
<title>Smart Speed Choices: Beyond the Posted Limits</title>`

    let items: Array<{
        title: string
        keywords: string[]
        script: string
    }> = []

    const stream = streamText({
        model: openai('gpt-4o'),
        system: 'You are an educational content creator focused on clear, practical legal explanations within strict time limits.',
        prompt,
    })
    let lastYieldTime = 0
    let allText = ''
    for await (const chunk of stream.textStream) {
        const now = Date.now()
        allText += chunk

        const result = extractTagsArrays({
            xml: allText,
            tags: ['title', 'keywords', 'video_script'],
        })

        // Update items with any new complete sets
        const newItems = result.title.map((title, i) => ({
            title,
            keywords: result.keywords[i]?.split(',').map((k) => k.trim()) || [],
            script: result.video_script[i] || '',
        }))

        items = newItems
        if (now - lastYieldTime < 1000) {
            continue
        }

        // Yield current state of items at most once per second
        yield items
        lastYieldTime = now
    }

    // Make sure to yield final state
    yield items
}
