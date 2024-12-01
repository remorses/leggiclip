import { motion } from 'framer-motion'
import { Form, redirect, useActionData, useNavigation } from 'react-router'

export function meta() {
    return [
        { title: 'AI Video Generator' },
        {
            name: 'description',
            content: 'Generate AI videos from your content',
        },
    ]
}

import { ActionFunction } from 'react-router'
import { truncateText } from '~/lib/browser-utils'


export const clientAction: ActionFunction = async ({ request }) => {
    const formData = await request.formData()
    const description = formData.get('description') as string
    const avatar = formData.get('avatar') as string
    const pdf = formData.get('pdf') as File
    // Read the PDF file content // TODO if of type pdf convert via ocr first
    const pdfText = truncateText(await pdf.text())

    // Store in localStorage for later use

    localStorage.setItem('pdfText', pdfText)

    if (!pdfText) {
        return { error: 'PDF file is required' }
    }

    const searchParams = new URLSearchParams({
        description,
        avatar,
        title: 'Speed Limits Explained',
        keywords: ['driving', 'safety', 'laws', 'speed limits'].join(','),
    })

    const s = searchParams.toString()
    console.log('Redirecting to generate page:', s)
    return redirect(`/generate?${s}`)
}

export default function Home() {
    const actionData = useActionData()
    const isLoading = useNavigation().state !== 'idle'

    return (
        <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
            <header className="fixed top-0 left-0 right-0 z-50">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex-shrink-0">
                            <h1 className="text-2xl font-bold text-gray-900">LeggiClip</h1>
                        </div>
                        <div>
                            <a href="/generate" className="text-gray-600 hover:text-gray-900">Previous Generations</a>
                        </div>
                    </div>
                </div>
            </header>
            <div className='text-center -mt-[20%]'>
                <h1 className='text-3xl font-bold text-gray-900 mb-8'>
                    Video di Divulgazione con AI
                </h1>
                <div className='max-w-xl mx-auto text-center'>
                    <p className='text-lg text-gray-500 mb-8'>
                        Trasforma contenuti complessi in video educativi. Rendi
                        semplici e accessibili argomenti difficili attraverso
                        contenuti coinvolgenti.
                    </p>
                </div>
            </div>

            <Form
                method='post'
                className='space-y-6'
                encType='multipart/form-data'
            >
                <div className='flex justify-center'>
                    <motion.div className='w-[600px] flex-col flex gap-3'>
                        <div>
                            {/* <label
                                htmlFor='avatar'
                                className='block text-sm font-medium text-gray-700 mb-2'
                            >
                                Avatar Gender
                            </label>
                            <select
                                id='avatar'
                                defaultValue={actionData?.avatar || 'male'}
                                name='avatar'
                                className='block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                required
                            >
                                <option value=''>Select gender</option>
                                <option value='male'>Male</option>
                                <option value='female'>Female</option>
                            </select> */}
                        </div>

                        <div className='relative'>
                            <textarea
                                id='description'
                                name='description'
                                rows={4}
                                className='mt-1 block w-full rounded-2xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm'
                                placeholder='Describe what you want in your video...'
                                // required
                                defaultValue={actionData?.description}
                            />

                            <div className='absolute bottom-3 left-3 flex flex-row items-start gap-3'>
                                <div className="relative">
                                    <input
                                        type='number'
                                        id='numVideos'
                                        name='numVideos'
                                        min='1'
                                        max='10'
                                        defaultValue='3'
                                        className='w-20 rounded-full px-3 py-2 text-sm text-gray-900 focus:ring-indigo-500 focus:outline-none bg-gray-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                                        videos
                                    </span>
                                </div>
                                <input
                                    type='file'
                                    id='pdf'
                                    name='pdf'
                                    accept='.pdf,.txt'
                                    placeholder='Choose PDF file'
                                    className='text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-gray-100 file:text-gray-700
                                        hover:file:bg-gray-200
                                        file:content-["Choose_PDF_file"]'
                                />
                            </div>

                            <button
                                type='submit'
                                disabled={isLoading}
                                className={`absolute bottom-3 right-3 py-2 px-4 rounded-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isLoading ? 'opacity-50' : ''}`}
                            >
                                {isLoading ? 'Loading...' : 'Generate'}
                            </button>
                        </div>
                    </motion.div>
                </div>
                {actionData?.error && (
                    <div className='mt-4 text-red-600 text-sm'>
                        {actionData.error}
                    </div>
                )}
            </Form>
        </div>
    )
}
