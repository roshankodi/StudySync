import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Script started");

  const email = "roshan@test.com";

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  let user;

  if (!existing) {
    user = await prisma.user.create({
      data: {
        name: "Roshan",
        email,
      },
    });
    console.log("✅ User created");
  } else {
    user = existing;
    console.log("ℹ️ User already exists");
  }

  console.log(user);

  const users = await prisma.user.findMany();
  console.log("👥 All users:", users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());