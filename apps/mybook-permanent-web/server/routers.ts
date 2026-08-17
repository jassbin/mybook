import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createChoices, createComparison, createPortrait, createSession, continueSession } from "./narrative";

const locale = z.enum(["zh-CN", "en-US"]);
const mode = z.enum(["normal", "extreme"]);
const stateSchema = z.object({
  bookTitle: z.string(), character: z.string(), locale, mode, actNumber: z.number(), maxActs: z.number(), pressureLevel: z.number(),
  axes: z.array(z.object({ key: z.string(), low: z.string(), high: z.string(), value: z.number() })),
  history: z.array(z.object({ act: z.number(), choiceId: z.string(), choiceText: z.string() })),
});
const actSchema = z.object({
  number: z.number(), title: z.string(), sceneName: z.string(), messages: z.array(z.object({ id: z.string(), text: z.string(), innerVoice: z.string().optional() })),
  choices: z.array(z.object({ id: z.enum(["A", "B", "C"]), text: z.string(), revealText: z.string(), axis: z.string(), delta: z.number() })),
  consequences: z.array(z.object({ choiceId: z.enum(["A", "B", "C"]), text: z.string() })), forceContinue: z.string(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  narrative: router({
    begin: publicProcedure.input(z.object({ bookTitle: z.string().min(1).max(80), character: z.string().min(1).max(80), locale, mode })).mutation(({ input }) => createSession(input)),
    choices: publicProcedure.input(z.object({ state: stateSchema, act: actSchema })).mutation(({ input }) => createChoices(input)),
    continue: publicProcedure.input(z.object({ state: stateSchema, choice: actSchema.shape.choices.element })).mutation(({ input }) => continueSession(input)),
    portrait: publicProcedure.input(stateSchema).mutation(({ input }) => createPortrait(input)),
    comparison: publicProcedure.input(z.object({ normal: stateSchema, extreme: stateSchema })).mutation(({ input }) => createComparison(input.normal, input.extreme)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
