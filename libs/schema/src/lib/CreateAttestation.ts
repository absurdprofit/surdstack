import { z } from 'zod'

const attestationConveyancePreference = z.union([
    z.literal('direct'),
    z.literal('enterprise'),
    z.literal('indirect'),
    z.literal('none')
])

const authenticatorAttachment = z.union([
    z.literal('cross-platform'),
    z.literal('platform')
])

const userVerificationRequirement = z.union([
    z.literal('discouraged'),
    z.literal('preferred'),
    z.literal('required')
])

export const createAttestationResponse = z.object({
    credentialId: z.string(),
    publicKey: z.object({
        rp: z.object({
            name: z.string(),
            id: z.string(),
            icon: z.string()
        }),
        user: z.object({
            name: z.string(),
            displayName: z.string(),
            id: z.string()
        }),
        challenge: z.string(),
        pubKeyCredParams: z.array(
            z.object({
                type: z.literal('public-key'),
                alg: z.number()
            })
        ),
        timeout: z.number(),
        attestation: attestationConveyancePreference,
        authenticatorSelection: z.object({
            authenticatorAttachment: authenticatorAttachment,
            requireResidentKey: z.boolean(),
            userVerification: userVerificationRequirement
        })
    })
})
