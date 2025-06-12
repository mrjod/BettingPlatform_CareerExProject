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
            html: `<h1>Here is the Token to rest your password, please click on the button,
            <a class"" href='/reset-password/${token}'> Reset Password </a>

            if the button does not work , please copt this click below to your browser
            <a href='/reset-password/${token}'> Reset Password </a>
           
            </h1>`
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