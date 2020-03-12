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

module.exports = {
    users,
    chats,
}