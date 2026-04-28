"use client";

import * as React from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  ClipboardList,
  Folder,
  GripVertical,
  Home,
  ListTodo,
  Pencil,
  Plane,
  Plus,
  RotateCcw,
  Settings,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createTodoCategory,
  createTodo,
  deleteTodoCategory,
  deleteDoneTodos,
  deleteTodo,
  reorderTodos,
  setTodoCompleted,
  updateTodoCategory,
  updateTodoText,
  type CategoryDTO,
  type TodoDTO,
} from "./actions";

type CategoryWithTodos = CategoryDTO & { todos: TodoDTO[] };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shopping_bag: ShoppingBag,
  todo: ListTodo,
  home: Home,
  travel: Plane,
  list: ClipboardList,
};

const ICON_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "shopping_bag", label: "Shopping" },
  { key: "todo", label: "Todo" },
  { key: "home", label: "Home" },
  { key: "travel", label: "Travel" },
  { key: "list", label: "List" },
];

function CategoryIcon({ icon }: { icon: string }) {
  const key = icon.trim().toLowerCase();
  const Icon = ICONS[key] ?? Folder;
  return <Icon className="h-4 w-4" />;
}

function getActiveTodos(category: CategoryWithTodos) {
  return category.todos
    .filter((t) => !t.isCompleted)
    .slice()
    .sort((a, b) => a.order - b.order);
}

function getDoneTodos(category: CategoryWithTodos) {
  return category.todos.filter((t) => t.isCompleted);
}

function SortableTodoRow(props: {
  todo: TodoDTO;
  onDone: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.todo.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-background px-2 py-2"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          className="w-full truncate text-left"
          onClick={props.onRename}
          title="Click to rename"
        >
          {props.todo.text}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={props.onDone}
          aria-label="Mark done"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={props.onDelete}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TodoBoard({
  initialCategories,
}: {
  initialCategories: CategoryWithTodos[];
}) {
  const [categories, setCategories] = React.useState<CategoryWithTodos[]>(
    initialCategories
  );
  const [activeCategoryId, setActiveCategoryId] = React.useState<string | null>(
    initialCategories[0]?.id ?? null
  );

  const activeCategory = React.useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) ?? null;
  }, [categories, activeCategoryId]);

  const [isAddCategoryOpen, setIsAddCategoryOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [addSelectedIconKey, setAddSelectedIconKey] = React.useState<string>(
    ICON_OPTIONS[0]?.key ?? "shopping_bag"
  );

  const [isEditCategoryOpen, setIsEditCategoryOpen] = React.useState(false);
  const [editCategoryName, setEditCategoryName] = React.useState("");
  const [editSelectedIconKey, setEditSelectedIconKey] = React.useState<string>(
    ICON_OPTIONS[0]?.key ?? "shopping_bag"
  );
  const [isConfirmDeleteCategoryOpen, setIsConfirmDeleteCategoryOpen] =
    React.useState(false);

  const [isAddTodoOpen, setIsAddTodoOpen] = React.useState(false);
  const [newTodoText, setNewTodoText] = React.useState("");

  const [renameTodoId, setRenameTodoId] = React.useState<string | null>(null);
  const [renameText, setRenameText] = React.useState("");

  const [confirmDeleteTodoId, setConfirmDeleteTodoId] = React.useState<string | null>(null);
  const [isConfirmDeleteDoneOpen, setIsConfirmDeleteDoneOpen] = React.useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const activeTodos = activeCategory ? getActiveTodos(activeCategory) : [];
  const doneTodos = activeCategory ? getDoneTodos(activeCategory) : [];

  const commitRename = async () => {
    const todoId = renameTodoId;
    const text = renameText.trim();

    if (!todoId) return;
    if (!text) return;

    setRenameTodoId(null);
    setRenameText("");

    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        todos: c.todos.map((t) => (t.id === todoId ? { ...t, text } : t)),
      }))
    );

    try {
      await updateTodoText({ todoId, text });
    } catch {
      // ignore
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!activeCategory) return;

    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = activeTodos.findIndex((t) => t.id === active.id);
    const newIndex = activeTodos.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(activeTodos, oldIndex, newIndex);
    const orderedIds = reordered.map((t) => t.id);

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id !== activeCategory.id) return c;
        const updatedTodos = c.todos.map((t) => {
          const idx = orderedIds.indexOf(t.id);
          if (idx === -1) return t;
          return { ...t, order: idx };
        });
        return { ...c, todos: updatedTodos };
      })
    );

    try {
      await reorderTodos({ categoryId: activeCategory.id, orderedTodoIds: orderedIds });
    } catch {
      // ignore; user can refresh
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    const icon = addSelectedIconKey.trim();
    if (!name || !icon) return;

    try {
      const created = await createTodoCategory({ name, icon });
      setCategories((prev) => [...prev, { ...created, todos: [] }]);
      setActiveCategoryId(created.id);
      setNewCategoryName("");
      setAddSelectedIconKey(ICON_OPTIONS[0]?.key ?? "shopping_bag");
      setIsAddCategoryOpen(false);
    } catch {
      // ignore; keep inputs
    }
  };

  const openEditCategory = () => {
    if (!activeCategory) return;
    setEditCategoryName(activeCategory.label);
    setEditSelectedIconKey(activeCategory.icon);
    setIsEditCategoryOpen(true);
  };

  const handleUpdateCategory = async () => {
    if (!activeCategory) return;
    const name = editCategoryName.trim();
    const icon = editSelectedIconKey.trim();
    if (!name || !icon) return;

    const optimistic: CategoryDTO = {
      id: activeCategory.id,
      name: activeCategory.name,
      label: name.toUpperCase(),
      icon,
    };

    setCategories((prev) =>
      prev.map((c) => (c.id === activeCategory.id ? { ...c, ...optimistic } : c))
    );

    setIsEditCategoryOpen(false);

    try {
      const updated = await updateTodoCategory({
        todoCategoryId: activeCategory.id,
        name,
        icon,
      });

      setCategories((prev) =>
        prev.map((c) => (c.id === activeCategory.id ? { ...c, ...updated } : c))
      );
    } catch {
      // ignore
    }
  };

  const handleDeleteCategory = async () => {
    if (!activeCategory) return;
    const deletingId = activeCategory.id;

    const remaining = categories.filter((c) => c.id !== deletingId);

    setIsConfirmDeleteCategoryOpen(false);
    setIsEditCategoryOpen(false);

    setCategories(remaining);
    setActiveCategoryId((prev) => (prev === deletingId ? remaining[0]?.id ?? null : prev));

    try {
      await deleteTodoCategory({ todoCategoryId: deletingId });
    } catch {
      // ignore
    }
  };

  const openAddTodo = () => {
    if (!activeCategory) return;
    setIsAddTodoOpen(true);
  };

  const handleCreateTodo = async () => {
    if (!activeCategory) return;
    const text = newTodoText.trim();
    if (!text) return;

    setNewTodoText("");
    setIsAddTodoOpen(false);

    try {
      const created = await createTodo({ categoryId: activeCategory.id, text });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === activeCategory.id
            ? { ...c, todos: [...c.todos, created] }
            : c
        )
      );
    } catch {
      // ignore
    }
  };

  const handleDone = async (todoId: string) => {
    if (!activeCategory) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory.id
          ? {
              ...c,
              todos: c.todos.map((t) =>
                t.id === todoId ? { ...t, isCompleted: true } : t
              ),
            }
          : c
      )
    );

    try {
      await setTodoCompleted({ todoId, isCompleted: true });
    } catch {
      // ignore
    }
  };

  const handleUndo = async (todoId: string) => {
    if (!activeCategory) return;

    try {
      const updated = await setTodoCompleted({ todoId, isCompleted: false });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === activeCategory.id
            ? {
                ...c,
                todos: c.todos.map((t) => (t.id === todoId ? updated : t)),
              }
            : c
        )
      );
    } catch {
      // ignore
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!activeCategory) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory.id
          ? { ...c, todos: c.todos.filter((t) => t.id !== todoId) }
          : c
      )
    );

    try {
      await deleteTodo({ todoId });
    } catch {
      // ignore
    }
  };

  const handleDeleteDone = async () => {
    if (!activeCategory) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory.id
          ? { ...c, todos: c.todos.filter((t) => !t.isCompleted) }
          : c
      )
    );

    try {
      await deleteDoneTodos({ categoryId: activeCategory.id });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Todos</h1>
            <p className="text-muted-foreground">Per-category todo lists</p>
          </div>
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setIsAddCategoryOpen(true)}
            aria-label="Add TodoCategory"
            title="Add TodoCategory"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add TodoCategory</DialogTitle>
            <DialogDescription>Choose a name and icon.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 px-4 pb-4">
            <Input
              placeholder="TodoCategory name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
              autoFocus
            />

            <div className="space-y-2">
              <div className="text-sm font-medium">Icon</div>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const isActive = addSelectedIconKey === opt.key;
                  return (
                    <Button
                      key={opt.key}
                      type="button"
                      variant={isActive ? "default" : "secondary"}
                      onClick={() => setAddSelectedIconKey(opt.key)}
                      className="gap-2"
                    >
                      <CategoryIcon icon={opt.key} />
                      {opt.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeCategory && (
        <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit TodoCategory</DialogTitle>
              <DialogDescription>Rename or change icon.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3 px-4 pb-4">
              <Input
                placeholder="TodoCategory name"
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateCategory();
                }}
                autoFocus
              />

              <div className="space-y-2">
                <div className="text-sm font-medium">Icon</div>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((opt) => {
                    const isActive = editSelectedIconKey === opt.key;
                    return (
                      <Button
                        key={opt.key}
                        type="button"
                        variant={isActive ? "default" : "secondary"}
                        onClick={() => setEditSelectedIconKey(opt.key)}
                        className="gap-2"
                      >
                        <CategoryIcon icon={opt.key} />
                        {opt.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsEditCategoryOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateCategory}
                disabled={!editCategoryName.trim()}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {activeCategory && (
        <Dialog
          open={isConfirmDeleteCategoryOpen}
          onOpenChange={setIsConfirmDeleteCategoryOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete TodoCategory?</DialogTitle>
              <DialogDescription>
                This will delete the category and all related tasks.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsConfirmDeleteCategoryOpen(false)}
              >
                No
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {categories.length > 0 ? (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const pendingCount = category.todos.filter((t) => !t.isCompleted).length;
              const isActive = category.id === activeCategoryId;
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "secondary"}
                  onClick={() => setActiveCategoryId(category.id)}
                  className="gap-2"
                >
                  <CategoryIcon icon={category.icon} />
                  <span className="max-w-40 truncate">{category.label}</span>
                  <Badge variant={isActive ? "secondary" : "outline"}>
                    {pendingCount}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {activeCategory && (
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="icon"
                onClick={openEditCategory}
                aria-label="Edit TodoCategory"
                title="Edit TodoCategory"
              >
                <Pencil className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    aria-label="TodoCategory actions"
                    title="TodoCategory actions"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => setIsConfirmDeleteCategoryOpen(true)}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-sm text-muted-foreground">
            Create a category to start.
          </CardContent>
        </Card>
      )}

      {activeCategory && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Todo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeTodos.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeTodos.map((todo) => (
                      <SortableTodoRow
                        key={todo.id}
                        todo={todo}
                        onDone={() => handleDone(todo.id)}
                        onDelete={() => setConfirmDeleteTodoId(todo.id)}
                        onRename={() => {
                          setRenameTodoId(todo.id);
                          setRenameText(todo.text);
                        }}
                      />
                    ))}
                    {activeTodos.length === 0 && (
                      <div className="text-sm text-muted-foreground">No todos yet.</div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Done</CardTitle>
              <Button
                variant="secondary"
                onClick={() => setIsConfirmDeleteDoneOpen(true)}
                disabled={doneTodos.length === 0}
              >
                Delete All
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {doneTodos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center justify-between gap-2 rounded-md border bg-background px-2 py-2"
                >
                  <div className="min-w-0 flex-1 truncate text-muted-foreground">
                    {todo.text}
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleUndo(todo.id)}
                    aria-label="Undo"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {doneTodos.length === 0 && (
                <div className="text-sm text-muted-foreground">No completed tasks.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeCategory && (
        <Dialog open={renameTodoId !== null} onOpenChange={(open) => {
          if (!open) {
            setRenameTodoId(null);
            setRenameText("");
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Task</DialogTitle>
              <DialogDescription>Update the task name.</DialogDescription>
            </DialogHeader>
            <div className="px-4 pb-4">
              <Input
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setRenameTodoId(null);
                  setRenameText("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={commitRename} disabled={!renameText.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {activeCategory && (
        <Dialog open={confirmDeleteTodoId !== null} onOpenChange={(open) => {
          if (!open) setConfirmDeleteTodoId(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Task?</DialogTitle>
              <DialogDescription>This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmDeleteTodoId(null)}>
                No
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  const id = confirmDeleteTodoId;
                  setConfirmDeleteTodoId(null);
                  if (id) await handleDelete(id);
                }}
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {activeCategory && (
        <Dialog open={isConfirmDeleteDoneOpen} onOpenChange={setIsConfirmDeleteDoneOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete All Done Tasks?</DialogTitle>
              <DialogDescription>Deletes all completed tasks in this TodoCategory.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsConfirmDeleteDoneOpen(false)}>
                No
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsConfirmDeleteDoneOpen(false);
                  await handleDeleteDone();
                }}
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {activeCategory && (
        <Dialog open={isAddTodoOpen} onOpenChange={setIsAddTodoOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Todo</DialogTitle>
              <DialogDescription>
                Add a new task to {activeCategory.label}.
              </DialogDescription>
            </DialogHeader>

            <div className="px-4 pb-4">
              <Input
                placeholder="New task"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateTodo();
                }}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsAddTodoOpen(false);
                  setNewTodoText("");
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTodo} disabled={!newTodoText.trim()}>
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {activeCategory && (
        <Button
          type="button"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full"
          onClick={openAddTodo}
          aria-label="Add todo"
        >
          <span className="text-xl leading-none">+</span>
        </Button>
      )}
    </div>
  );
}
