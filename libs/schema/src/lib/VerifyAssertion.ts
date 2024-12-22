import { z } from 'zod'

export const verifyAssertionResponse = z.object({
    authn_token: z.string(),
    expires: z.number()
})

export const verifyAssertionRequest = z.object({
    id: z.string(),
    response: z.object({
        clientDataJSON: z.string(),
        signature: z.string(),
        authenticatorData: z.string()
    })
})
