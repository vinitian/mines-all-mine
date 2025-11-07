
# Mines All Mine
Online Minesweeper clone project for 2190472 Netcentric Architecture.

## Project members
1. 6638031621 Jitawat Pinyosnit ([@FaDeAWAYut](https://github.com/FaDeAWAYut))
2. 6638139821 Pemika Chantaraseno ([@amukamu2](https://github.com/amukamu2))
3. 6638217021 Vinita Jungwiwattanaporn ([@vinitian](https://github.com/vinitian))
4. 6638222121 Sasiras Yodruangsa ([@Sasirasys](https://github.com/Sasirasys))
5. 6638091221 Thanyamaiphon Kittisakulvong ([@Thanyamaiphon](https://github.com/Thanyamaiphon))
6. 6638128921 Panas Damrongsiri ([@PanPan-22](https://github.com/PanPan-22))

## Tech Stack & Tools Used
- SocketIO
- React
- Next.js
- PostgreSQL + Prisma
- Auth.js
- Figma
- TailwindCSS

## Features
1. Setup server and game client
   - One computer runs both the server program and a game client.
   - Another computer runs only game client that will directly connect to the server.

2. Client
   - Each client must first connect to the server and receive information about other connected clients.
   - Each client knows the server's IP address and port number which are predefined in the client's source code.
   - A player can enter a nickname when the game starts.
   - Welcome message appears on the game starts.
   - The player's nickname and score appeared on the game client.
   - Player cannot see any bombs until they found them.
   - Each client displays a game timer which can count down.
   - Every selected grid must be disabled.
   - After the grid is selected, it has to be marked as "bomb" or "free slot".
   - Increase scores when the bomb is found.

3. Server
   - The server program has a user interface which shows the number of concurrent clients currently online.
   - The server user interface also has a reset button to reset all current game state and players' scores.
   - Server randomizes first player that will start the game.

4. Additional features
   - Sign in with Google for server device
   - Room settings
     - More map sizes
     - Timer options
     - Max player
   - Database for rooms and signed-in users
   - Randomize map generation
   - Join room by code, invite link, or room list
   - Chat which persists in lobby and game page
   - Responsive web
   - Room host actions: kick players and delete room
   - Player can leave room by disconnect or ":eave Room" button
   - Open cell logic & bomb hint numbers

## Screenshots
![Screenshot of home page 1](public/screenshots/1%20-%20Home%20page.png)
![Screenshot of home page 2](public/screenshots/2%20-%20Home%20page%20-%20signed%20in%20user.png)
![Screenshot of room list page 1](public/screenshots/3%20-%20Room%20list%20page.png)
![Screenshot of room list page 2](public/screenshots/4%20-%20Room%20list%20page%202.png)
![Screenshot of lobby page 1](public/screenshots/5%20-%20Lobby%20page%20-%20host%20view.png)
![Screenshot of lobby page 2](public/screenshots/6%20-%20Lobby%20page%20-%20host%20view%202.png)
![Screenshot of lobby page 3](public/screenshots/7%20-%20Lobby%20page%20-%20non-host%20view.png)
![Screenshot of lobby page 4](public/screenshots/8%20-%20Lobby%20page%20-%20chat.png)
![Screenshot of lobby page 5](public/screenshots/9%20-%20Lobby%20page%20-%20mobile.png)
![Screenshot of game page 1](public/screenshots/10%20-%20Game%20page.png)
![Screenshot of game page 1](public/screenshots/11%20-%20Game%20page%20-%20game%20over.png)
![Screenshot of game page 3](public/screenshots/12%20-%20Game%20page%20-%20mobile.jpg)
![Screenshot of invite page 1](public/screenshots/13%20-%20Invite%20page.png)
![Screenshot of invite page 2](public/screenshots/14%20-%20Invite%20page%20-%20sign%20in%20user.png)

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
