const nodemailer = require("nodemailer")

const sendForgotPasswordEmail = async (email, token)=>{
    try {
        const mailTransport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: `${process.env.EMAIL}`,
                pass: `${process.env.EMAIL_PASSWORD}`
            }
        })
        const mailDetails = {
            from: `${process.env.EMAIL}`,
            to: `${email}`,
            subject: "Reset Password Notification",
            html: `<h1>Please reset your password</h1>

            <p>If you requested a reset, click the button below:</p>

            <table cellspacing="0" cellpadding="0" style="margin: auto;">
            <tr>
                <td bgcolor="#3498db" style="border-radius: 5px; text-align: center;">
                <a href="https://bettingplatform-careerexproject.onrender.com/reset-password/${token}"
                    target="_blank"
                    style="display: inline-block;
                            padding: 12px 25px;
                            font-family: Arial, sans-serif;
                            font-size: 14px;
                            color: #ffffff;
                            text-decoration: none;
                            font-weight: bold;
                            border: 1px solid #3498db;
                            border-radius: 5px;">
                    Reset Password
                </a>
                </td>
            </tr>
            </table>

            <p style="font-family: Arial, sans-serif; font-size: 12px; color: #555;">
            If the button above doesn't work, copy & paste this link into your browser:<br>
            <a href="${process.env.CLIENT_URL}/reset-password/${token}"
                style="word-break: break-all;">
                ${process.env.CLIENT_URL}/reset-password/${token}
            </a>
            </p>

            `
        }
        await mailTransport.sendMail(mailDetails)
        
    } catch (error) {
        return res.status(500).json({message: error})
        
    }
 
    
}


const validEmail = (email)=>{
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(String(email).toLowerCase)
}

module.exports = {
    sendForgotPasswordEmail,
    validEmail

}