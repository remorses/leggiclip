import { deployFly, getDopplerEnv, shell } from '@xmorse/deployment-utils'

async function main() {
    // const stage = getCurrentStage()
    const env = await getDopplerEnv({ stage: 'production', project: 'website' })
    env.FORCE_COLOR = '1'
    await shell(`pnpm --filter spiceflow build`, {
        env,
    })

    await Promise.all([
        // shell(`pnpm tsc`, {
        //     env,
        // }),
        // shell(`pnpm --filter template-rewrite-framer build`, {
        //     env,
        // }),
        // shell(`pnpm --filter github-framer build`, {
        //     env,
        // }),
        // shell(`pnpm --filter angled-screen build`, {
        //     env,
        // }),
    ])
    await Promise.all([
        shell(`pnpm build`, {
            env,
        }),
    ])

    const port = 8040
    await deployFly({
        appName: 'leggiclip',
        port,
        buildRemotely: true,
        // strategy: 'rolling',
        dockerfile: 'Dockerfile',
        minInstances: 1,
        forceHttps: false,
        maxInstances: 1,
        healthCheckPath: '/api/health',
        memorySize: '512mb',
        machineType: 'shared-cpu-1x',
        depot: true,
        // statics: [
        //     {
        //         guest_path: '/app/build/client',
        //         url_prefix: '/',
        //         index_document: 'index.html',
        //     },
        // ],
        env: {
            ...env,
            NODE_ENV: 'production',
            PORT: String(port),
        },
        regions: ['iad'],
    })
}

main()
