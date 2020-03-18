const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserID } = require('../utils')

async function verify(userId, context, args) {
    const verification = await context.prisma.$exists.chat({
        AND: [
            { id: args.chat },
            { users_some: { id: userId } },
        ],
    })

    return verification
}

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
    const verification = await verify(userId, context, args)

    if (!verification) {
        throw new Error("No perteneces a este chat o el chat no existe")
    }

    return await context.prisma.createMessage({
        message: args.message,
        chat_id: { connect: { id: args.chat } },
        user: { connect: { id: userId } },
    })
}

async function view_message(root, args, context) {
    const userId = getUserID(context)
    const verification = await verify(userId, context, args)

    if (!verification) {
        throw new Error("No perteneces a este chat o el chat no existe")
    }

    const unviewed_messages = await context.prisma.messagesConnection({
        where: {
            AND: [
                { chat_id: { id: args.chat } },
                { viewed_none: { user:{ id: userId } } },
            ],
        },
        orderBy: "created_at_DESC",
    }).edges()

    const data = []
    for(var i = 0; i < unviewed_messages.length; i++){
        var a = await context.prisma.updateMessage({
            data: {
                viewed: {
                    create: { user: { connect: { id: userId } } }
                }
            },
            where: {
                id: unviewed_messages[i].cursor
            }
        })
        data.push(a)
    }

    return data
}

module.exports = {
    login,
    signup,
    send_message,
    view_message,
}