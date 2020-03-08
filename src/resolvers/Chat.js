function users(parent, args, context, info) {
    return context.prisma.chat({ id: parent.id }).users()
}

function messages(parent, args, context, info) {
    return context.prisma.chat({ id: parent.id }).messages()
}

module.exports = {
    users,
    messages,
}