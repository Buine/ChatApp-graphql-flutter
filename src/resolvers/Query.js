const { getUserID }  = require('../utils')

function users (root, args, context, info) {
    var userId = getUserID(context)
    return context.prisma.users()
}

module.exports = {
    users,
}