import { DomHandler, Parser, ElementType } from 'htmlparser2'
import domSerializer from 'dom-serializer'



export function extractTagsArrays<T extends string>({
    xml,
    tags,
}: {
    xml: string
    tags: T[]
}): Record<T, string[]> & { others: string[] } {
    const result = { others: [] } as Record<T, string[]> & { others: string[] }

    // Initialize arrays for each tag
    tags.forEach((tag) => {
        result[tag as any] = [] as string[]
    })

    try {
        const handler = new DomHandler((error, dom) => {
            if (error) {
                console.error('Error parsing XML:', error)
            } else {
                const findTags = (nodes: any[]) => {
                    nodes.forEach((node) => {
                        if (node.type === ElementType.Tag) {
                            if (tags.includes(node.name as T)) {
                                result[node.name].push(
                                    domSerializer(node.children, {
                                        xmlMode: true,
                                        decodeEntities: false,
                                        encodeEntities: false,
                                    }).trim(),
                                )
                            }
                            if (node.children) {
                                findTags(node.children)
                            }
                        } else if (
                            node.type === ElementType.Text &&
                            node.data.trim()
                        ) {
                            result.others.push(node.data.trim())
                        }
                    })
                }

                findTags(dom)
            }
        })

        const parser = new Parser(handler, {
            xmlMode: true,
            decodeEntities: false,
        })
        parser.write(xml)
        parser.end()
    } catch (error) {
        console.error('Unexpected error in extractTags:', error)
    }

    return result
}
