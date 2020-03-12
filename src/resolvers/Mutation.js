const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserID } = require('../utils')

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

async function send_message(root, args, context) {
    const userId = getUserID(context)
    const verify = await context.prisma.chatsConnection({
        where: {
            AND: [
                { id: args.chat },
                { users_some: { id: userId } },
            ]
        }
    }).edges()[0]

    if (!verify) {
        throw new Error("No perteneces a este chat o el chat no existe")
    }
    
    return await context.prisma.createMessage({
        message: args.message,
        chat_id: { connect: { id: args.chat } },
        user: { connect: { id: userId } },
    })
}

module.exports = {
    login,
    signup,
    send_message,
}