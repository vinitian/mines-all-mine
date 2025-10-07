import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const ian = await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      email: "vinitian@gmail.com",
      name: "iannnn",
      img_url:
        "https://lh3.googleusercontent.com/a/ACg8ocLHUUMTzgoWM01phRVo05k07ZYCD6Z_MxTaFXhay0IugZJYnnoWZg=s64-c",
    },
  });
  const king = await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      email: "sasirasys@gmail.com",
      name: "Sasirasys",
      img_url:
        "https://lh3.googleusercontent.com/a-/ALV-UjUnXa5c80Rtgi5Ij541nHunwUoja8OqM6yHKb-FoAer8PWAdxOaXw=s64-c",
    },
  });
  const tan = await prisma.user.upsert({
    where: { id: 3 },
    update: {},
    create: {
      email: "fadeaway33799@gmail.com",
      name: "IMFADED",
      img_url:
        "https://lh3.googleusercontent.com/a-/ALV-UjW3aJ-YdkPLOdlr0UDDqoXbInO_PtcTd7PaujdAE4BIc2TL9W8p=s64-c",
    },
  });
  const palmy = await prisma.user.upsert({
    where: { id: 4 },
    update: {},
    create: {
      email: "palmy.pemika@gmail.com",
      name: "amukamu4",
      img_url:
        "https://lh3.googleusercontent.com/a-/ALV-UjUtIeAouwpQJWILsfdJJXtuYWa5bv0WBBeTxYanu4QjC-uFYQ=s64-c",
    },
  });
  const august = await prisma.user.upsert({
    where: { id: 5 },
    update: {},
    create: {
      email: "panasdamrongsiri@gmail.com",
      name: "PanPan",
      img_url:
        "https://lh3.googleusercontent.com/a-/ALV-UjV7cf7i0Cya0Yz4THYqdJsmltIX-0zPp739aL6pRvdx6DQKgn3HdA=s64-c",
    },
  });
  const opal = await prisma.user.upsert({
    where: { id: 6 },
    update: {},
    create: {
      email: "opallthanyamaiphon@gmail.com",
      name: "OP",
      img_url:
        "https://lh3.googleusercontent.com/a-/ALV-UjVrXrFEWDwCX2derO-sRwmdBl_J0wypCeuenmUejIAMDS14jKw=s64-c",
    },
  });
  console.log({ ian, king, tan, palmy, august, opal });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
