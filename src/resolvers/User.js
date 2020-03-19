function chats(parent, args, context, info) {
    return context.prisma.user({ id: parent.id }).chats()
}

function blocked(parent, args, context, info) {
    return context.prisma.user({ id: parent.id }).blocked()
}

module.exports = {
    chats,
    blocked,
}