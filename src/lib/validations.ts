import { z } from "zod";

const uuid = z.string().uuid("Invalid ID format");

const supabaseUserId = z.string().uuid("Invalid user ID format");

const safeText = (maxLen: number) =>
  z
    .string()
    .max(maxLen, `Must be ${maxLen} characters or less`)
    .refine((v) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(v), {
      message: "Contains invalid characters",
    });

const email = z.string().email("Invalid email address").max(320);

export const createBoardSchema = z.object({
  name: safeText(50).refine((v) => v.trim().length > 0, {
    message: "Board name is required",
  }),
  description: safeText(500).optional(),
});

export const updateBoardSchema = z.object({
  name: safeText(50)
    .refine((v) => v.trim().length > 0, { message: "Board name is required" })
    .optional(),
  description: safeText(500).nullable().optional(),
});

export const boardIdSchema = z.object({
  boardId: uuid,
});

export const getBoardsSchema = z.object({
  userId: supabaseUserId,
});

export const createBoardWithUserSchema = z.object({
  data: createBoardSchema,
  userId: supabaseUserId,
});

export const createColumnSchema = z.object({
  boardId: uuid,
  name: safeText(100).refine((v) => v.trim().length > 0, {
    message: "Column name is required",
  }),
  position: z.number().int().min(0).max(100),
});

export const updateColumnSchema = z.object({
  columnId: uuid,
  data: z.object({
    name: safeText(100).optional(),
    position: z.number().int().min(0).max(100).optional(),
  }),
});

export const deleteColumnSchema = z.object({
  columnId: uuid,
});

export const reorderColumnsSchema = z.object({
  boardId: uuid,
  orderedIds: z
    .array(
      z.object({
        id: uuid,
        position: z.number().int().min(0).max(100),
      })
    )
    .min(1)
    .max(100),
});

export const priorityEnum = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  columnId: uuid,
  data: z.object({
    title: safeText(200).refine((v) => v.trim().length > 0, {
      message: "Task title is required",
    }),
    description: safeText(5000).optional(),
    priority: priorityEnum.optional().default("medium"),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    position: z.number().int().min(0).max(10000),
  }),
  userId: supabaseUserId.optional(),
});

export const updateTaskSchema = z.object({
  taskId: uuid,
  data: z.object({
    title: safeText(200).optional(),
    description: safeText(5000).nullable().optional(),
    priority: priorityEnum.optional(),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
      .nullable()
      .optional(),
    position: z.number().int().min(0).max(10000).optional(),
    column_id: uuid.optional(),
  }),
});

export const deleteTaskSchema = z.object({
  taskId: uuid,
});

export const taskLabelsSchema = z.object({
  taskId: uuid,
  labelIds: z.array(uuid).max(50),
});

export const moveTaskSchema = z.object({
  taskId: uuid,
  columnId: uuid,
  position: z.number().int().min(0).max(10000),
});

export const taskPositionsSchema = z.array(
  z.object({
    id: uuid,
    column_id: uuid,
    position: z.number().int().min(0).max(10000),
  })
).max(10000);


export const inviteMemberSchema = z.object({
  boardId: uuid,
  email: email,
});

export const removeMemberSchema = z.object({
  boardId: uuid,
  userId: supabaseUserId,
});

export const logActivitySchema = z.object({
  boardId: uuid,
  action: safeText(100),
  entityType: safeText(50),
  entityId: uuid.nullable(),
  details: z.record(z.string(), z.unknown()).optional(),
  userId: supabaseUserId.optional(),
});

export class ValidationError extends Error {
  public readonly issues: z.ZodIssue[];

  constructor(error: z.ZodError) {
    const message = error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    super(`Validation failed: ${message}`);
    this.name = "ValidationError";
    this.issues = error.issues;
  }
}

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error);
  }
  return result.data;
}
