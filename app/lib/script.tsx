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
    const prompt = `Analyze the law text and generate exactly ${numItems} concise 30-second educational TikTok video scripts about: ${description}

Law text:
<law_text>
${lawText}
</law_text>

Let's first understand this law deeply:
- What is the core purpose of this law?
- Who does this law affect directly and indirectly?
- What are the key obligations or rights it establishes?
- What are the consequences of non-compliance?
- What common situations does this law address?

Now, let's identify the most compelling questions about this specific law:
- What aspects of this law surprise or confuse people?
- Which parts have the most direct impact on daily life?
- What are the most common violations people make unknowingly?
- What rights do people not know they have under this law?
- What misconceptions exist about this specific legislation?

For each video, structure the content like this:
- Hook: Present the law-specific question dramatically
- Setup: Show a real situation where this law applies
- Answer: Explain the legal principle clearly
- Action: Give practical compliance tips

Then, provide exactly ${numItems} sets of responses in XML format, each containing:
<output_language>italian</output_language>
<video_script>Engaging script that poses and answers ONE specific question about this law in 30 seconds</video_script>
<keywords>At least 8 comma-separated search terms for background footage that matches the script timeline</keywords>
<title>A compelling question directly related to this law text</title>

Example output:
<output_language>italian</output_language>
<video_script>Il tuo datore di lavoro può leggere le tue chat personali sul computer aziendale?

Molti pensano sia una violazione della privacy. Ma attenzione!

La legge sulla privacy stabilisce che:
- Gli strumenti aziendali possono essere monitorati
- L'azienda deve informarti preventivamente
- Il controllo deve essere proporzionato

Proteggi la tua privacy: usa i dispositivi personali per le comunicazioni private. Sul pc aziendale, solo lavoro.</video_script>
<keywords>ufficio moderno, computer lavoro, chat messenger, privacy dati, ambiente professionale</keywords>
<title>Può Il Capo Spiare Le Tue Chat Sul PC Aziendale?</title>`

    let items: Array<{
        language: string
        title: string
        keywords: string[]
        script: string
    }> = []

    const stream = streamText({
        model: openai('gpt-4o'),
        system: 'You are a TikTok legal educator who excels at explaining specific laws through engaging questions. Focus only on questions directly related to the provided law text. Always write in Italian.',
        prompt,
    })
    let lastYieldTime = 0
    let allText = ''
    for await (const chunk of stream.textStream) {
        const now = Date.now()
        allText += chunk

        const result = extractTagsArrays({
            xml: allText,
            tags: ['output_language', 'title', 'keywords', 'video_script'],
        })

        // Update items with any new complete sets
        const newItems = result.title.map((title, i) => ({
            language: result.output_language[i] || 'italian',
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
# Guida alla Formattazione degli Script Vocali

## Punteggiatura
- Trattini (-): Dividere le sillabe
- Virgole (,): Pause brevi
- Punti (.): Pause lunghe con tono discendente

## Pronuncia
- Fare doppio clic sulle parole per impostare la pronuncia personalizzata
- Usare i trattini per l'enfasi
- Formattare gli acronimi: "AI" → "a-i", "AWS" → "a-vu-doppia-esse"

## Numeri
- Scrivere i numeri in lettere: "2012" → "duemila dodici"
- Formattare le date: "10-19-2016" → "diciannove ottobre duemila sedici"
- Formattare le frazioni: "3/8" → "tre ottavi"
- Formattare gli orari: "01:18" → "un minuto e diciotto secondi"
- Formattare gli indirizzi: "150th CT NE" → "150esima Corte Nord Est"
`
