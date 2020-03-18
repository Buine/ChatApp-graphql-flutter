function user(parent, args, context, info) {
    return context.prisma.viewed({ id: parent.id }).user()
}

function message(parent, args, context, info) {
    return context.prisma.viewed({ id: parent.id }).message()
}

module.exports = {
    user,
    message,
}