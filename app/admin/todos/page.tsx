import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TodoBoard from "./todo-board";

export const dynamic = "force-dynamic";

export default async function AdminTodosPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  const categories = await prisma.todoCategory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      label: true,
      icon: true,
      todos: {
        orderBy: [{ isCompleted: "asc" }, { order: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          todoCategoryId: true,
          text: true,
          isCompleted: true,
          order: true,
        },
      },
    },
  });

  return <TodoBoard initialCategories={categories} />;
}
