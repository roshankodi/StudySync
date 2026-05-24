import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { chatRouter } from "@/server/api/routers/chat/create";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);