import { z } from 'zod'

const userVerificationRequirement = z.union([
    z.literal('discouraged'),
    z.literal('preferred'),
    z.literal('required')
]);

export const createAssertionResponse = z.object({
    publicKey: z.object({
        rpId: z.string(),
        userVerification: userVerificationRequirement,
        challenge: z.string(),
        allowCredentials: z.array(
            z.object({
                type: z.literal('public-key'),
                id: z.string()
            })
        ),
        timeout: z.number()
    })
});