import { describe, it, expect } from 'vitest'
import { extractTagsArrays } from './xml'
import dedent from 'dedent'

describe('extractTagsArrays', () => {
    it('extracts tags and their content from XML', () => {
        const xml = dedent`
            <title>First Title</title>
            <output_language>italian</output_language>
            <video_script>First script content</video_script>
            <keywords>keyword1, keyword2</keywords>
            Some other text
            <title>Second Title</title>
            <output_language>italian</output_language>
            <video_script>Second script content</video_script>
            <keywords>keyword3, keyword4</keywords>
        `

        const result = extractTagsArrays({
            xml,
            tags: ['title', 'output_language', 'video_script', 'keywords'],
        })

        expect(result.title).toEqual(['First Title', 'Second Title'])
        expect(result.output_language).toEqual(['italian', 'italian'])
        expect(result.video_script).toEqual([
            'First script content',
            'Second script content',
        ])
        expect(result.keywords).toEqual([
            'keyword1, keyword2',
            'keyword3, keyword4',
        ])
        expect(result.others).toEqual(['Some other text'])
    })

    it('handles empty XML gracefully', () => {
        const result = extractTagsArrays({
            xml: '',
            tags: ['title', 'output_language'],
        })

        expect(result.title).toEqual([])
        expect(result.output_language).toEqual([])
        expect(result.others).toEqual([])
    })

    it('handles XML with no matching tags', () => {
        const xml = `
            <other>Some content</other>
            Plain text
        `

        const result = extractTagsArrays({
            xml,
            tags: ['title', 'output_language'],
        })

        expect(result.title).toEqual([])
        expect(result.output_language).toEqual([])
        expect(result.others).toEqual(['Plain text'])
    })
})
