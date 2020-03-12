function user(parent, args, context, info) {
    return context.prisma.message({ id: parent.id }).user()
}

function chat_id(parent, args, context, info) {
    return context.prisma.message({ id: parent.id }).chat_id()
}

function viewed(parent, args, context, info) {
    return context.prisma.message({ id: parent.id }).viewed()
}

module.exports = {
    user,
    chat_id,
    viewed,
}