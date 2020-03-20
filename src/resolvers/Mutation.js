const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { APP_SECRET, getUserID } = require('../utils')

async function verify(userId, context, args) {
    return await context.prisma.$exists.chat({
        AND: [
            { id: args.chat },
            { users_some: { user: { id: userId } } },
        ],
    })
}

async function blocked(userId, context, args) {
    return await context.prisma.users({
        where:{
            AND: [
                { id: args.user },
                { blocked_some: { id: userId } }
            ]
        }
    })
}

async function login (root, args, context) {
    const user = await context.prisma.user({ username: args.username })
    if(!user) {
        throw new Error("El usuario no existe")
    }

    const valid = await bcrypt.compare(args.password, user.password)
    if(!valid) {
        throw new Error("La contraseña incorrecta")
    }

    const token = jwt.sign({ userId: user.id }, APP_SECRET, { expiresIn: "1 year" })

    return { token, user }
}

async function signup (root, args, context) {
    const password = await bcrypt.hash(args.password, 10)
    
    const user = await context.prisma.createUser({
        username: args.username,
        password: password,
        email: args.email,
    })

    const token = jwt.sign({ userId: user.id }, APP_SECRET, { expiresIn: "1 year" })
    return { token, user }
}

async function send_message(root, args, context) {
    const userId = getUserID(context)
    const verification = verify(userId, context, args)

    if (!verification) {
        throw new Error("No perteneces a este chat o el chat no existe")
    }

    const chat = await context.prisma.chat({ id: args.chat })
    if(chat.is_private){
        const other_user = await context.prisma.chats({ 
            where:{ 
                AND: [
                    { id: args.chat }, 
                    { users_some: { user: { id_not: userId }}}
                ] 
            }
        }).users({where: { user: { id_not: userId  } }}).user()
        //console.log(other_user[0].users[0])
        const blocked = await context.prisma.users({ 
            where: { 
                OR: [ 
                    { AND: [{id: other_user[0].users[0].id }, { blocked_some: { id: userId } }]}, 
                    { AND: [{id: userId}, { blocked_some: { id: other_user[0].users[0].id } }]} 
                ] 
            } 
        }) // Si son 2 resultados significa que ambos bloqueados mutuamente, 1 resultado es un bloqueo, 0 es una relación normal
        console.log(blocked)
        if(blocked.length != 0){
            throw new Error("No puedes responder a este chat")
        }
    }

    return context.prisma.createMessage({
        message: args.message,
        chat_id: { connect: { id: args.chat } },
        user: { connect: { id: userId } },
    })
}

async function view_message(root, args, context) {
    const userId = getUserID(context)
    const verification = await verify(userId, context, args)

    if (!verification) {
        throw new Error("No perteneces a este chat o el chat no existe")
    }

    const unviewed_messages = await context.prisma.messagesConnection({
        where: {
            AND: [
                { chat_id: { id: args.chat } },
                { viewed_none: { user:{ id: userId } } },
            ],
        },
        orderBy: "created_at_DESC",
    }).edges()

    const data = []
    for(var i = 0; i < unviewed_messages.length; i++){
        var a = await context.prisma.updateMessage({
            data: {
                viewed: {
                    create: { user: { connect: { id: userId } } }
                }
            },
            where: {
                id: unviewed_messages[i].cursor
            }
        })
        data.push(a)
    }

    return data
}

async function create_private_chat(root, args, context) {
    const userId = getUserID(context)
    const exist = await context.prisma.$exists.user({ id: args.user })
    const isBlocked = await blocked(userId, context, args)
    
    if(!exist && isBlocked){
        console.log({ exist, isBlocked }) 
        throw new Error("El usuario no existe") 
    }

    const chat_exist = await context.prisma.chats({ 
        where: {
            users_every: {
                user:{ id_in: [ userId, args.user ] }
            }
        }
    })

    if(chat_exist[0]){
        throw new Error("El chat ya existe")
    }
    
    return context.prisma.createChat({
        users: { create: [ { user:{ connect: { id: userId } }, class: "USER" }, { user:{ connect: { id: args.user } }, class: "USER" } ] },
        is_private: true,
    })
}

async function create_group_chat(root, args, context) {
    const userId = getUserID(context)

    if(args.users.includes(userId)){
        throw new Error("No puedes invitarte al grupo a ti mismo")
    }

    if(args.users.length < 1){
        throw new Error("Debes seleccionar al menos un usuario")
    } else if (args.users.length > 256) { 
        throw new Error("No se pueden crear grupos de mas de 256 usuarios") 
    }

    const userVerify = await context.prisma.users({
        where:{
            AND:[
                { id_in: args.users },
                { blocked_none: { id: userId }},
            ]
        }
    })

    if(args.users.length != userVerify.length){
        throw new Error("En la lista hay usuarios que no son validos")
    }

    var usersData = userVerify.map(function(user) {
        return { user: { connect: { id: user.id } }, class: "USER" }
    })
    usersData.unshift({ user: { connect: { id: userId } }, class: "ADMIN" })

    return context.prisma.createChat({
        chat_name: args.chat_name,
        is_private: false,
        users: {
            create: usersData
        }
    })
}

async function add_users_group_chat(root, args, context) {
    const userId = getUserID(context)

    if(args.users.includes(userId)){
        throw new Error("No puedes invitarte al grupo a ti mismo")
    }

    if(args.users.length < 1){
        throw new Error("Debes seleccionar al menos un usuario")
    }
    
    const verification = await context.prisma.chats({
        where:{
            AND:[
                { users_some: { user: { id: userId } } },
                { id: args.chat }, { is_private: false },
            ]
        }
    }).users({ where: { user: { id: userId } } })

    if(!verification[0].users[0]){
        throw new Error("No perteneces a este chat o el chat no existe")
    }
    if(verification[0].users[0].class != "ADMIN" && verification[0].users[0].class != "MODERATOR"){
        throw new Error("No tienes los permisos necesarios para invitar usuarios")
    }

    const userVerify = await context.prisma.users({
        where:{
            AND:[
                { id_in: args.users },
                { blocked_none: { id: userId }},
                { chats_none: { chat: { id: args.chat } } },
            ]
        }
    })

    if(args.users.length != userVerify.length){
        throw new Error("En la lista hay usuarios que ya estan en el grupo o no son validos")
    }

    const n_users = await context.prisma.membersConnection({ where: { chat: { id: args.chat } } }).aggregate()

    if(n_users.count + args.users.length > 256){
        throw new Error("No se ha podido agregar, el grupo de chat no puede tener mas de 256 usuarios")
    }

    var users_Add = args.users.map(function(user) {
        return { class: "USER", user: { connect: { id: user } } }
    })

    return context.prisma.updateChat({
        data:{ users: { create: users_Add } },
        where: { id: args.chat }
    })
}

async function delete_users_group_chat(root, args, context) {
    const userId = getUserID(context)

    if(args.users.length < 1){
        throw new Error("Debes seleccionar al menos un usuario")
    } 

    let currentUser = await context.prisma.membersConnection({
        where: { AND: [ {chat: { id: args.chat } }, { user: { id: userId } } ] }
    }).edges()

    console.log(currentUser[0].node)

    if(!currentUser[0]){
        throw new Error("No pertences a este chat o no existe")
    }

    let userClass = currentUser[0].node.class

    if(userClass == "USER"){
        throw new Error("No tienes los permisos necesarios para eliminar usuarios")
    }

    let whereClass = userClass == "MODERATOR" ? { class: "USER" } : { OR: [{ class: "USER" }, { class: "MODERATOR" }] }

    const userVerify = await context.prisma.membersConnection({
        where:{
            AND:[
                { user: { id_in: args.users } },
                { chat: { id: args.chat } },
                whereClass
            ]
        }
    })

    if(args.users.length != userVerify.edges.length){
        throw new Error("Ocurrio un error al intentar eliminar a los usuarios seleccionados, verifica que tengas los permisos adecuados")
    }

    let usersDelete = userVerify.edges.map(function(member){
        return {id: member.node.id}
    })

    console.log("[Delete User in Chat Group] This debug test: ", {usersDelete})

    return context.prisma.updateChat({ data: { users: { delete: usersDelete } }, where: { id: args.chat } })
}

async function left_group_chat(root, args, context) {
    const userId = getUserID(context)
    const memberId = await context.prisma.membersConnection({
        where: { AND: [{user: { id: userId }}, {chat: { id: args.chat }}] }
    }).edges()

    if(!memberId[0]){
        throw new Error("No perteneces al chat o el chat no existe")
    }

    if(memberId[0].node.class == "ADMIN"){
       const newAdmin = await context.prisma.membersConnection({
            where: { chat: { id: args.chat } },
            orderBy: "class_DESC",
            first: 1
        }).edges()
        await context.prisma.updateMember({ where: { id: newAdmin[0].node.id }, data: { class: "ADMIN" } })
    }

    return context.prisma.updateChat({
        data: { users: { delete: { id: memberId[0].node.id } } }, where: { id: args.chat }
    })
}

function block_user(root, args, context) {
    const userId = getUserID(context)
    return context.prisma.updateUser({
        data: { blocked: { connect: { id: args.user } } },
        where: { id: userId }
    })
}

function unblock_user(root, args, context) {
    const userId = getUserID(context)
    return context.prisma.updateUser({
        data: { blocked: { disconnect: { id: args.user } } },
        where: { id: userId }
    })
}

module.exports = {
    login,
    signup,
    send_message,
    view_message,
    create_private_chat,
    create_group_chat,
    add_users_group_chat,
    delete_users_group_chat,
    left_group_chat,
    block_user,
    unblock_user,
}