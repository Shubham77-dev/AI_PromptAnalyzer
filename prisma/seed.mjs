import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@promptlib.dev" },
    update: {},
    create: { email: "demo@promptlib.dev" },
  });

  const existing = await prisma.prompt.findFirst({
    where: { userId: user.id, status: "PUBLISHED" },
    select: { id: true },
  });

  if (existing) return;

  await prisma.prompt.create({
    data: {
      userId: user.id,
      status: "PUBLISHED",
      content:
        "You are a helpful assistant. Summarize the text below in 5 bullet points. Keep each bullet under 12 words.\n\nTEXT:\n{{paste text here}}",
      analysis: {
        create: {
          accuracy: 82,
          clarity: 84,
          suggestions:
            "Add target audience or reading level. Include any must-keep facts. Specify whether to keep numbers and names unchanged.",
        },
      },
      stats: { create: { likes: 3, usage: 0 } },
    },
  });
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

