const jwt = require("jsonwebtoken")
const APP_SECRET = "KEY_TEST"

function getUserID(context) {
    const Authorization = context.request.get('Authorization')
    if (Authorization){
        const token = Authorization.replace("Bearer ", "")
        const { userId } = jwt.verify(token, APP_SECRET)
        return userId
    }
    throw new Error("You are not authorized to access")
}

module.exports = {
    APP_SECRET,
    getUserID,
}