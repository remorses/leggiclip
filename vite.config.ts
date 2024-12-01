import { reactRouter } from '@react-router/dev/vite'
import { viteExternalsPlugin } from '@xmorse/deployment-utils/dist/vite-externals-plugin'

import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    css: {
        postcss: {
            plugins: [tailwindcss, autoprefixer],
        },
    },
    test: {
        update: true,
    },
    
    plugins: [reactRouter(), tsconfigPaths(), viteExternalsPlugin({})],
    resolve: {
        alias: {
            '@remix-run/react': 'react-router',
        },
    },
    clearScreen: false,
})
