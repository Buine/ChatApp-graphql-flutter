const { getUserID }  = require('../utils')

function users (root, args, context, info) {
    var userId = getUserID(context)
    const where = args.filter ? { "username_contains": args.filter } : {}
    return context.prisma.users({ "where": where })
}

function chats (root, args, context, info) {
    var userId = getUserID(context)
    return context.prisma.chats({ where: { users_some: { id: userId } } })
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
            AND: [
                { message: { id: args.message } },
                { user: { id: userId } }
            ],
        }
    })
}

module.exports = {
    users,
    chats,
    messages,
    info_message,
}