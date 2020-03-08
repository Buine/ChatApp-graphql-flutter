const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserId } = require('../utils')

async function login (root, args, context) {
    const user = await context.prisma.user({ username: args.username })
    if(!user) {
        throw new Error("El usuario no existe")
    }

    const valid = await bcrypt.compare(args.password, user.password)
    if(!valid) {
        throw new Error("La contraseña incorrecta")
    }

    const token = jwt.sign({ userId: user.id }, APP_SECRET, { expiresIn: "1 year" })

    return { token, user }
}

async function signup (root, args, context) {
    const password = await bcrypt.hash(args.password, 10)
    
    const user = await context.prisma.createUser({
        username: args.username,
        password: password,
        email: args.email,
    })

    const token = jwt.sign({ userId: user.id }, APP_SECRET, { expiresIn: "1 year" })
    return { token, user }
}

module.exports = {
    login,
    signup,

}