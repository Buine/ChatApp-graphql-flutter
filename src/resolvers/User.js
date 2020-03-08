function chats(parent, args, context, info) {
    return context.prisma.user({ id: parent.id }).chats()
}

module.exports = {
    chats,
}