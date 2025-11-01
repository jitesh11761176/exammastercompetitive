import { Resend } from 'resend'
// @ts-ignore - optional in-script env loading for local runs only
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testEmail() {
  console.log('📧 Testing Resend Email Configuration...\n')

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  // Check if configured
  if (!apiKey || apiKey.includes('YOUR_RESEND')) {
    console.log('❌ Resend not configured!\n')
    console.log('📋 Steps to configure:')
    console.log('  1. Go to https://resend.com')
    console.log('  2. Create account (free)')
    console.log('  3. Create API key')
    console.log('  4. Update RESEND_API_KEY in .env file')
    console.log('  5. Update RESEND_FROM_EMAIL in .env file\n')
    console.log('Example:')
    console.log('  RESEND_API_KEY="re_xxxxx"')
    console.log('  RESEND_FROM_EMAIL="noreply@resend.dev"\n')
    return
  }

  try {
    console.log('📡 Initializing Resend...')
    const resend = new Resend(apiKey)

    console.log('📨 Sending test email...')
    console.log(`  From: ${fromEmail}`)
    console.log(`  To: jiteshshahpgtcs2@gmail.com\n`)

    const { data, error } = await resend.emails.send({
      from: fromEmail!,
      to: 'jiteshshahpgtcs2@gmail.com',
      subject: 'Test Email from ExamMaster Pro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">🎉 Email Configuration Successful!</h1>
          <p style="font-size: 16px; line-height: 1.6;">
            Your Resend email configuration is working perfectly!
          </p>
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Configuration Details:</h2>
            <ul>
              <li><strong>Service:</strong> Resend</li>
              <li><strong>From:</strong> ${fromEmail}</li>
              <li><strong>Status:</strong> ✅ Active</li>
            </ul>
          </div>
          <p style="font-size: 14px; color: #6B7280;">
            This is a test email from ExamMaster Pro. Your transactional email system is ready to send:
          </p>
          <ul style="color: #6B7280;">
            <li>Welcome emails</li>
            <li>Password reset links</li>
            <li>Test result notifications</li>
            <li>Study reminders</li>
            <li>Achievement notifications</li>
          </ul>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          <p style="font-size: 12px; color: #9CA3AF;">
            ExamMaster Pro - Competitive Exam Platform
          </p>
        </div>
      `
    })

    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }

    console.log('✅ Email sent successfully!\n')
    console.log('📊 Email Details:')
    console.log(`  Email ID: ${data?.id ?? 'N/A'}`)
    console.log(`  Status: Sent\n`)
    console.log('📬 Check your inbox: jiteshshahpgtcs2@gmail.com\n')
    console.log('💡 You can also view this email in Resend dashboard:')
    console.log('   https://resend.com/emails\n')

  } catch (error: any) {
    console.error('\n❌ Error sending email!')
    console.error('Error:', error.message)
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Troubleshooting:')
      console.log('  1. Check if RESEND_API_KEY is correct')
      console.log('  2. Make sure you copied the entire key (starts with "re_")')
      console.log('  3. Verify the key is active in Resend dashboard')
    } else if (error.message.includes('from')) {
      console.log('\n💡 Troubleshooting:')
      console.log('  1. Check RESEND_FROM_EMAIL is correct')
      console.log('  2. If using custom domain, verify it\'s verified in Resend')
      console.log('  3. For testing, use "onboarding@resend.dev"')
    }
  }
}

testEmail()
