const { getUserID }  = require('../utils')

function users (root, args, context, info) {
    var userId = getUserID(context)
    const where = args.filter ? { "username_contains": args.filter } : {}
    return context.prisma.users({ "where": where })
}

async function info_chat(root, args, context, info) {
    var userId = getUserID(context)

    // Lista con ID's bloqueados
    const list_blocked = await context.prisma.user({ id: userId }).blocked()
    var list = []
    list_blocked.forEach(user_blocked => {
        list.push(user_blocked.id)
    });

    const chat = await context.prisma.chats({ 
        where: { 
            AND: [
                { id: args.chat },
                { users_some: { id: userId } },
                { OR: [
                    { is_private: false },
                    { AND: [ { is_private: true }, { users_none: { id_in: list } } ] }
                ], },
            ],
        } 
    })
    return chat[0]
}

async function chats (root, args, context, info) {
    var userId = getUserID(context)

    // Lista con ID's bloqueados
    const list_blocked = await context.prisma.user({ id: userId }).blocked()
    var list = []
    list_blocked.forEach(user_blocked => {
        list.push(user_blocked.id)
    });

    return context.prisma.chats({ 
        where: { 
            AND: [
                { users_some: { id: userId } },
                { OR: [
                    { is_private: false },
                    { AND: [ { is_private: true }, { users_none: { id_in: list } } ] }
                ], },
            ],
        } 
    })
}

function messages (root, args, context, info) {
    const userId = getUserID(context)
    return context.prisma.messages({ 
        where: { 
            chat_id: { AND: [{ id: args.chat }, { users_some: { id: userId } }] }
        },
        orderBy: args.orderBy,
        first: args.first 
    })
}

function info_message(root, args, context, info) {
    const userId = getUserID(context)
    return context.prisma.vieweds({
        where: {
            message: { 
                AND: [ 
                    { id: args.message },
                    { user: { id: userId } }, 
                ] ,
            }, 
        },
    })
}

module.exports = {
    users,
    chats,
    messages,
    info_message,
    info_chat,
}