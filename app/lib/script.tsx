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
    const prompt = `Analyze the law text and generate ${numItems} concise 30-second educational video scripts about: ${description}

Law text:
<law_text>
${lawText}
</law_text>

First, let's think through the key aspects step by step:

1. Core Legal Concepts:
- What is the single most important legal principle to convey?
- Which specific regulation needs clear explanation?

2. Real-World Impact:
- How does this law affect everyday situations?
- What's the most common misconception?

3. Practical Application:
- What is the key action people should take?
- What's the most important compliance tip?

4. Educational Goals:
- What is the ONE critical takeaway?
- How can we make this concept instantly relatable?

Now, structure each 30-second video using this tight framework:
1. The Hook (5s): Present a relatable situation
2. The Problem (5s): Show the legal challenge
3. The Solution (10s): Explain the key legal concept
4. The Action (10s): Give clear, practical guidance

Then, provide exactly ${numItems} sets of responses in XML format, each containing:
<video_script>Clear, direct script that fits within 30 seconds. Focus on ONE key learning and immediate practical application.</video_script>
<keywords>At least 5 comma-separated search terms for background footage that matches the script timeline. Each term will be used to find relevant video clips.</keywords>
<title>A focused title that captures the key learning</title>

Example output for one set:
<video_script>A driver speeds down a residential street. The speed limit is 25, but children are playing nearby.

Speed limits aren't just numbers - they're about protecting lives.

The law requires drivers to:
- Slow down in residential areas
- Watch for pedestrians
- Adjust speed for conditions

Remember: The right speed saves lives. Drive like your family lives here.</video_script>
<keywords>residential street view, children playing, speed limit sign, careful driving, neighborhood safety</keywords>
<title>Residential Speed Limits: Protecting Our Communities</title>`

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


let scriptPrompt = `
🕓🕓Use the Pause button for natural flow🕓🕓
There are two types of pauses-

In-script pause- Pause in between the words of the script.

Between-sections-pause- Pause made between different script sections in your video.

Move your text cursor to the desired location in the script.

Click the "🕓Add Pause🕓" button at the bottom left.

Each pause represents a half-second break; you can add multiple pauses for a longer break.

To create pauses between scripts, find the Clock Icon underneath your script.

 

✏️✏️Incorporate Punctuation Marks✏️✏️
Hyphens (-): Separate syllables for clear pronunciation.

Commas (,): Create shorter breaks.

Periods (.): Introduce longer breaks with downward inflection.

 

🔤🔤Ensure Correct Spelling and Language Consistency🔤🔤
Spell Correctly: Double-check your script for spelling errors.

Language Consistency: Avoid mixing languages. For instance, do not include Arabic words in an English script.

 

🗣️🗣️  Use our Pronunciation feature 🗣️ 🗣️ 
If you Preview your script and you feel some words aren't being pronounced correctly, you can double-click them and chose Pronunciation - here you can type exactly how you'd like the word to be pronounced. You can also use hyphens (-) to emphasize pronunciation.

This is particularly useful with Acronyms- 

"AI" should be "a-eye."

"AWS" becomes "a-double you-s."

 

 

 

🔢🔢 How to write Numbers 🔢🔢
You can write out numbers or use phonetic spelling for clarity. Examples:

"2012" should be "twenty twelve."

"3/8" becomes "three eighths of an inch."

"01:18" should be "one minute and eighteen seconds."

"10-19-2016" is "October nineteenth two thousand sixteen."

"150th CT NE, Redmond, WA" should be "150th Court Northeast Redmond Washington."

 

For a more detailed walkthrough of our Scripts feature, please see this article here. Happy scripting!
`