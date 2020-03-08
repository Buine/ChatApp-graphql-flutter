function user(parent, args, context, info) {
    return context.prisma.message({ id: parent.id }).user()
}

function chat_id(parent, args, context, info) {
    return context.prisma.message({ id: parent.id }).chat_id()
}

module.exports = {
    user,
    chat_id,
}