import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendVerificationEmail = async (email, name, verificationCode) => {
  try {
    await resend.emails.send({
      from: 'noreply@storycanvas.dev',
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
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}
