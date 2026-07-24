import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

console.log('[INIT] Resend API Key present:', process.env.RESEND_API_KEY ? 'YES ✓' : 'NO ✗')
console.log('[INIT] Resend instance created:', resend ? 'YES ✓' : 'NO ✗')

export const sendVerificationEmail = async (email, name, verificationCode) => {
  console.log('\n=== EMAIL SEND ATTEMPT ===')
  console.log('[EMAIL] Recipient:', email)
  console.log('[EMAIL] User name:', name)
  console.log('[EMAIL] Code:', verificationCode)
  console.log('[EMAIL] API Key loaded:', process.env.RESEND_API_KEY ? 'YES ✓' : 'NO ✗')
  
  if (!process.env.RESEND_API_KEY) {
    console.error('[EMAIL] ERROR: RESEND_API_KEY environment variable not set!')
    return false
  }
  
  try {
    console.log('[EMAIL] Calling resend.emails.send()...')
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Verify your Storycanvas email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #C9A84C;">Welcome to Storycanvas, ${name}!</h2>
          <p>Enter this code to verify your email:</p>
          <div style="background: #f0e6c8; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #0A0E17; letter-spacing: 5px; margin: 0; font-weight: 600;">${verificationCode}</h1>
          </div>
          <p style="color: #666; font-size: 12px;">This code expires in 1 hour.</p>
          <p style="color: #999; font-size: 11px;">If you didn't create this account, please ignore this email.</p>
        </div>
      `,
    })
    
    console.log('[EMAIL] ✓ SUCCESS')
    console.log('[EMAIL] Response ID:', result.id)
    console.log('[EMAIL] Email sent to:', email)
    console.log('=== EMAIL SEND COMPLETE ===\n')
    return true
    
  } catch (error) {
    console.error('\n[EMAIL] ✗ FAILED')
    console.error('[EMAIL] Error type:', error.constructor.name)
    console.error('[EMAIL] Error message:', error.message)
    console.error('[EMAIL] Full error:', JSON.stringify(error, null, 2))
    console.error('=== EMAIL SEND FAILED ===\n')
    return false
  }
}
