function users(parent, args, context, info) {
    return context.prisma.chat({ id: parent.id }).users()
}

function messages(parent, args, context, info) {
    return context.prisma.chat({ id: parent.id })
    .messages({ 
        first: args.onlyLastMessage ? 1 : null, 
        orderBy: "created_at_DESC" 
    })
}

module.exports = {
    users,
    messages,
}