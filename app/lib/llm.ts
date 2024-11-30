import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { extractTags } from './xml'

const openai = createOpenAI({
    apiKey: process.env.OPENAI_KEY,
})

export async function generateTikTokScript({
    lawText,
    description,
}: {
    lawText: string
    description: string
}): Promise<{ title: string; keywords: string[]; script: string }> {
    const prompt = `Convert this law text into an engaging TikTok video script. Focus on: ${description}

Law text: <law>
${lawText}
</law>

Return response in XML format with these tags in order:
<video_script>The actual TikTok script with intro and outro. This should be written in a friendly influencer style.</video_script>
<keywords>Provide at least 10 comma-separated search terms for background videos that match the timeline of your script. Each term will be used to find a video clip that plays during that part of the script. For example, if your script talks about "driving in rain" followed by "school zones", include those exact terms in that order.</keywords>
<title>An engaging video title</title>

Make the script friendly and use typical influencer style. Include a catchy intro like "Hey TikTok!" and an engaging outro like "Don't forget to follow for more legal tips!"

Do not output markdown, just XML.

Here is an example output:
<video_script>Hey TikTok! Your favorite legal bestie here with some CRAZY speed limit facts you need to know! 🤯

Did you know that speed limits aren't just random numbers? They're actually based on safety studies and road conditions! Mind = blown, right?

Let me break it down for you:
- 25 mph in neighborhoods (protect those kiddos!)
- 55 mph on regular roads (keep it steady!)
- And ALWAYS slow down for curves and bad weather (duh!)

The tea is: you can actually get a ticket even if you're going the speed limit... if conditions are dangerous! 😱

Stay safe out there besties! Don't forget to follow for more legal tips that could literally save your life! ✨ #LegalTok #DrivingSafety #RoadRules</video_script>
<keywords>influencer talking to camera, traffic safety studies chart, residential street with houses, highway traffic flowing, dangerous curve road sign, stormy weather driving, police officer giving ticket, social media follow button</keywords>
<title>5 Speed Limit Facts That Could Save Your Life! 🚗💨</title>
`

    const { text } = await generateText({
        model: openai('gpt-4o'),
        system: 'You are a charismatic TikTok influencer who explains laws in a fun and engaging way.',
        prompt,
    })

    console.log('Generated TikTok script:', text)
    const result = extractTags({
        xml: text,
        tags: ['title', 'keywords', 'video_script'],
    })

    return {
        title: result.title,
        keywords: result.keywords.split(',').map((k) => k.trim()),
        script: result.video_script,
    }
}
