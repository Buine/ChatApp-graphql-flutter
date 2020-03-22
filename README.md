# ChatApp-graphql-flutter

**Status**: *GraphQL-Server ready, Flutter not is ready.*

My first project with GraphQL and Flutter (All in this repository is experimental)

# Instructions for install in Windows
Requeried:
  - [Docker Composer](https://docs.docker.com/docker-for-windows/install/)
  - [Node.js](https://nodejs.org/es/download/) (Include NPM)
  - [Yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable)
  
## Steps:
  1. Clone this repository or download in zip
  2. Open CMD and type 
  > cd your-root-folder-project-here
  
  **Example: cd C:\Users\StebanCastro\ChatApp**
  
  And type 
  > yarn install
  
  for install all dependencies
  
  3. Need install Prisma from NPM, type in CMD 
  > npm install -g prisma
  
  4. Open Docker Compose and test if running
  5. Type in CMD 
  > docker-compose up -d
  
  6. Last step type in CMD
  > "prisma deploy" 
  
  and your database primsa is running in localhost:4466 
  7. Run GraphQL-Server in CMD
  > "node src\index.js"
  
 
  8. Test localhost:4000
 
**That's all! :)**
