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

Let's first analyze the law's deeper implications:
- What are the less obvious but important aspects of this law?
- What subtle legal principles underpin this legislation?
- What complex interactions exist with other laws?
- What are the nuanced edge cases and exceptions?
- What sophisticated legal questions arise in practice?

Now, let's identify intellectually engaging questions:
- What legal paradoxes or complexities emerge from this law?
- Which aspects challenge conventional legal interpretation?
- What sophisticated legal principles are often misunderstood?
- How does this law adapt to evolving societal changes?
- What technical or procedural details deserve attention?

For each video, structure the content like this:
- Hook: Present a thought-provoking legal scenario
- Setup: Illustrate the nuanced legal context
- Analysis: Explain the underlying legal principles
- Application: Demonstrate practical legal reasoning

write all the outputs (including title) in Italian

non parlare di gare clandestine o di limiti di velocita. le keywords devono essere piu specifiche possibili, in una singola parola.

Avoid markdown output - use only punctuation and line breaks for pacing. For acronyms use trattino to separate letters, for example "a-i" for "AI". "a-vu-doppia-esse" for "AWS". 
For numbers write them in words, for example "uno" for "1", "due" for "2", "tre" for "3".

Then, provide exactly ${numItems} sets of responses in XML format, each containing:
<title>Una domanda stimolante sulle implicazioni di questa legge</title>
<output_language>italian</output_language>
<video_script>Analisi dettagliata di UN aspetto legale complesso in 30 secondi</video_script>
<keywords>At least 8 comma-separated search terms for background footage that matches the script timeline, single words only</keywords>

Example output:
<title>Quali farmaci comuni possono risultare positivi ai test antidroga durante la guida?</title>
<output_language>italian</output_language>
<video_script>
Quali farmaci comuni possono risultare positivi ai test antidroga durante la guida?

Lo sapevi che alcuni farmaci comuni possono farti risultare positivo al test antidroga durante i controlli stradali? Sì, anche gli antistaminici e gli sciroppi per la tosse possono dare falsi positivi!

Ecco le informazioni chiave: leggere le avvertenze sui medicinali, valutare gli effetti sulla guida e considerare alternative con il proprio medico curante.
</video_script>
<keywords>pharmacy, medicine bottles, driving test, police control, drowsy driver, warning labels, doctor consultation, traffic safety</keywords>
`

    let items: Array<{
        language: string
        title: string
        keywords: string[]
        script: string
        createdAt: number
    }> = []

    const stream = streamText({
        model: openai('gpt-4o'),
        temperature: 0.7,
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
            createdAt: Date.now() / 1000,
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
