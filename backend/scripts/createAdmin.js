
import prisma from "../src/config/prisma.js";
import bcrypt from "bcrypt";

const main = async () => {
  const name = process.env.ADMIN_NAME || "Platform Admin";
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD first.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error(
      "This email already exists. Choose a new email; no account was changed."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Admin account created successfully: ${admin.email}`);
};

main()
  .catch((error) => {
    console.error("Admin creation failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
