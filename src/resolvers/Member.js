function user(parent, args, context, info) {
    return context.prisma.member({ id: parent.id }).user()
}

function chat(parent, args, context, info) {
    return context.prisma.member({ id: parent.id }).chat()
}

module.exports = {
    user,
    chat,
}