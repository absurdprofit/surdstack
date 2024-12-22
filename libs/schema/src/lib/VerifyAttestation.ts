import { z } from 'zod'

export const verifyAttestationRequest = z.object({
    id: z.string(),
    response: z.object({
        clientDataJSON: z.string(),
        attestationObject: z.string()
    })
})
