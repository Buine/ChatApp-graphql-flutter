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

async function blocked(userId, context, args) {
    const blocked = await context.prisma.users({
        where:{
            AND: [
                { id: args.user },
                { blocked_some: { id: userId } }
            ]
        }
    })
    return blocked
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
    const verification = verify(userId, context, args)

    if (!verification) {
        throw new Error("No perteneces a este chat o el chat no existe")
    }

    const chat = await context.prisma.chat({ id: args.chat })
    if(chat.is_private){
        const other_user = await context.prisma.chat({ id: args.chat }).users({ where: { id_not: userId } })
        const blocked = await context.prisma.users({ 
            where: { 
                OR: [ 
                    { AND: [{id: other_user.id}, {blocked_some: { id: userId } }]}, 
                    { AND: [{id: userId}, { blocked_some: { id: other_user.id } }]} 
                ] 
            } 
        }) // Si son 0 resultados significa que ambos bloqueados mutuamente, 1 resultado es un bloqueo, 2 es una relación normal
        if(blocked.length != 2){
            throw new Error("No puedes responder a este chat")
        }
    }

    return context.prisma.createMessage({
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

async function create_private_chat(root, args, context) {
    const userId = getUserID(context)
    const exist = await context.prisma.$exists.user({ id: args.user })
    const isBlocked = await blocked(userId, context, args)
    
    if(!exist && isBlocked){
        console.log({ exist, isBlocked }) 
        throw new Error("El usuario no existe") 
    }

    const chat_exist = await context.prisma.chats({ 
        where: {
            users_every: {
                id_in: [ userId, args.user ]
            }
        }
    })

    if(chat_exist){
        throw new Error("El chat ya existe")
    }
    
    return context.prisma.createChat({
        users: { connect: [ { id: userId }, { id: args.user } ] },
        is_private: true,
    })
}

module.exports = {
    login,
    signup,
    send_message,
    view_message,
    create_private_chat,
}