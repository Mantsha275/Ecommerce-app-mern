// Create JWT, set it as an HTTP-only cookie, and send the response.
// IMPORTANT: the token is NOT included in the JSON body. Since the app relies
// on the HTTP-only cookie for auth, returning the token in the body as well
// would let any frontend JS (or an XSS payload) read and exfiltrate it,
// defeating the purpose of httpOnly.
const sendToken = (user, statusCode, res) => {
    const token = user.getJwtToken();

    const isProduction = process.env.NODE_ENV === "production";

    const cookieDays = Number(process.env.COOKIE_EXPIRES_TIME) || 7;

    const options = {
        expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
        httpOnly: true,
        // "secure" cookies are only sent over HTTPS - required in production,
        // and required by browsers whenever sameSite is "none".
        secure: isProduction,
        // "none" is needed when frontend and backend are on different domains
        // (e.g. separate Vercel deployments) and must be paired with secure:true.
        // "lax" is fine for local development on the same site.
        sameSite: isProduction ? "none" : "lax",
    };

    // Never send the password hash (or other sensitive fields) to the client.
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;

    res.status(statusCode).cookie("token", token, options).json({
        success: true,
        user: safeUser,
    });
};

export default sendToken;
