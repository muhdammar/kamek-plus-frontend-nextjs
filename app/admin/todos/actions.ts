"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function normalize(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function slugify(input: string) {
  const normalized = normalize(input).toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug;
}

async function requireUserId() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}

export type CategoryDTO = {
  id: string;
  name: string;
  label: string;
  icon: string;
};

export type TodoDTO = {
  id: string;
  todoCategoryId: string;
  text: string;
  isCompleted: boolean;
  order: number;
};

export async function createTodoCategory(input: { name: string; icon: string }) {
  const userId = await requireUserId();

  const rawName = normalize(input.name);
  const icon = normalize(input.icon);

  if (!rawName) throw new Error("TodoCategory name is required");
  if (!icon) throw new Error("Category icon is required");

  const label = rawName.toUpperCase();
  const name = slugify(rawName) || rawName.toLowerCase();

  const category = await prisma.todoCategory.create({
    data: {
      userId,
      name,
      label,
      icon,
    },
    select: { id: true, name: true, label: true, icon: true },
  });

  revalidatePath("/admin/todos");
  return category satisfies CategoryDTO;
}

export async function createTodo(input: { categoryId: string; text: string }) {
  const userId = await requireUserId();

  const todoCategoryId = input.categoryId;
  const text = normalize(input.text);

  if (!todoCategoryId) throw new Error("Category is required");
  if (!text) throw new Error("Todo text is required");

  const category = await prisma.todoCategory.findFirst({
    where: { id: todoCategoryId, userId },
    select: { id: true },
  });
  if (!category) throw new Error("Category not found");

  const maxOrder = await prisma.todo.aggregate({
    where: { userId, todoCategoryId, isCompleted: false },
    _max: { order: true },
  });

  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const todo = await prisma.todo.create({
    data: {
      userId,
      todoCategoryId,
      text,
      isCompleted: false,
      order: nextOrder,
    },
    select: {
      id: true,
      todoCategoryId: true,
      text: true,
      isCompleted: true,
      order: true,
    },
  });

  revalidatePath("/admin/todos");
  return todo satisfies TodoDTO;
}

export async function updateTodoText(input: { todoId: string; text: string }) {
  const userId = await requireUserId();

  const todoId = input.todoId;
  const text = normalize(input.text);

  if (!todoId) throw new Error("Todo is required");
  if (!text) throw new Error("Todo text is required");

  const canAccess = await prisma.todo.findFirst({
    where: { id: todoId, userId },
    select: { id: true },
  });

  if (!canAccess) throw new Error("Todo not found");

  const todo = await prisma.todo.update({
    where: { id: todoId },
    data: { text },
    select: {
      id: true,
      todoCategoryId: true,
      text: true,
      isCompleted: true,
      order: true,
    },
  });

  revalidatePath("/admin/todos");
  return todo satisfies TodoDTO;
}

export async function setTodoCompleted(input: { todoId: string; isCompleted: boolean }) {
  const userId = await requireUserId();

  const todoId = input.todoId;
  const isCompleted = input.isCompleted;

  if (!todoId) throw new Error("Todo is required");

  const existing = await prisma.todo.findFirst({
    where: { id: todoId, userId },
    select: { id: true, todoCategoryId: true },
  });

  if (!existing) throw new Error("Todo not found");

  let nextOrder: number | undefined;
  if (!isCompleted) {
    const maxOrder = await prisma.todo.aggregate({
      where: { userId, todoCategoryId: existing.todoCategoryId, isCompleted: false },
      _max: { order: true },
    });
    nextOrder = (maxOrder._max.order ?? -1) + 1;
  }

  const todo = await prisma.todo.update({
    where: { id: todoId },
    data: {
      isCompleted,
      ...(typeof nextOrder === "number" ? { order: nextOrder } : {}),
    },
    select: {
      id: true,
      todoCategoryId: true,
      text: true,
      isCompleted: true,
      order: true,
    },
  });

  revalidatePath("/admin/todos");
  return todo satisfies TodoDTO;
}

export async function deleteTodo(input: { todoId: string }) {
  const userId = await requireUserId();
  const todoId = input.todoId;
  if (!todoId) throw new Error("Todo is required");

  const canAccess = await prisma.todo.findFirst({
    where: { id: todoId, userId },
    select: { id: true },
  });

  if (!canAccess) throw new Error("Todo not found");

  await prisma.todo.delete({ where: { id: todoId } });

  revalidatePath("/admin/todos");
  return { ok: true } as const;
}

export async function deleteDoneTodos(input: { categoryId: string }) {
  const userId = await requireUserId();
  const todoCategoryId = input.categoryId;
  if (!todoCategoryId) throw new Error("Category is required");

  await prisma.todo.deleteMany({
    where: { userId, todoCategoryId, isCompleted: true },
  });

  revalidatePath("/admin/todos");
  return { ok: true } as const;
}

export async function reorderTodos(input: { categoryId: string; orderedTodoIds: string[] }) {
  const userId = await requireUserId();
  const todoCategoryId = input.categoryId;
  const orderedTodoIds = input.orderedTodoIds;

  if (!todoCategoryId) throw new Error("Category is required");
  if (!Array.isArray(orderedTodoIds)) throw new Error("Invalid order payload");

  const todos = await prisma.todo.findMany({
    where: {
      userId,
      todoCategoryId,
      isCompleted: false,
      id: { in: orderedTodoIds },
    },
    select: { id: true },
  });

  if (todos.length !== orderedTodoIds.length) {
    throw new Error("One or more todos are invalid");
  }

  await prisma.$transaction(
    orderedTodoIds.map((id, index) =>
      prisma.todo.updateMany({
        where: { id, userId, todoCategoryId, isCompleted: false },
        data: { order: index },
      })
    )
  );

  revalidatePath("/admin/todos");
  return { ok: true } as const;
}
