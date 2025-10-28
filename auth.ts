import NextAuth from "next-auth";
import prisma from "@/prisma/prisma";
import GoogleProvider from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !user.name || !user.image) {
        return false;
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        // Create new user if doesn't exist
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            img_url: user.image,
          },
        });
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
  },
});
