import { createSpiceflowClient } from 'spiceflow/client'
import type { App, app } from '~/routes/api.$'

// Create type-safe client for the API routes
export const client = createSpiceflowClient<App>('')
