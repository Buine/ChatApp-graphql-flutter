const { GraphQLServer } = require('graphql-yoga')
const { prisma } = require('../src/generated/prisma-client')

const Query = require("../src/resolvers/Query")
const Mutation = require("../src/resolvers/Mutation")
const Subscription = require("../src/resolvers/Subscription")
const Message = require("../src/resolvers/Message")
const User = require("../src/resolvers/User")
const Chat = require("../src/resolvers/Chat")
const Viewed = require("../src/resolvers/Viewed")

const resolvers = {
    Query,
    Mutation,
    Subscription,
    Message,
    User,
    Chat,
    Viewed,
}

const server = new GraphQLServer({
    typeDefs: 'C:/Users/Buine-PC/ChatApp/src/schema.graphql',
    resolvers,
    context: request => {
        return {
            ...request,
            prisma,
        }
    }
})
server.start(() => console.log("Server is running on http://localhost:4000"))