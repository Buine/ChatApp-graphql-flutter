const jwt = require("jsonwebtoken")
const { APP_SECRET } = require("../utils")

function newMessageSubscribe(parent, args, context, info) {
    const userId = jwt.verify(args.token, APP_SECRET) //Temporal para verificar identidad
    return context.prisma.$subscribe.message({ 
        mutation_in: "CREATED",
        node:{
            chat_id:{
                users_some:{
                    user:{
                        id: userId.userId
                    }
                }
            }
        }
    }).node()
}

const newMessage = {
    subscribe: newMessageSubscribe,
    resolve: payload => {
        return payload
    },
}

module.exports = {
    newMessage,
}