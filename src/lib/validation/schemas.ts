import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(80, "Name must be under 80 characters"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be under 72 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createConversationSchema = z.object({
  userId: z.number().int().positive(),
});
export type CreateConversationInput = z.infer<typeof createConversationSchema>;

export const MESSAGE_MAX_LENGTH = 4000;

export const sendMessageSchema = z.object({
  conversationId: z.number().int().positive(),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MESSAGE_MAX_LENGTH, `Message must be under ${MESSAGE_MAX_LENGTH} characters`),
});
export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const conversationIdSchema = z.object({
  conversationId: z.number().int().positive(),
});

export const typingSchema = z.object({
  conversationId: z.number().int().positive(),
});

export const searchUsersSchema = z.object({
  query: z.string().trim().max(120).optional().default(""),
});
