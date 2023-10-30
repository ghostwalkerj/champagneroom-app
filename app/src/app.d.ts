/// <reference types="@sveltejs/kit" />
import type IORedis from 'ioredis';

import type { AgentDocument } from '$lib/models/agent';
import type { CreatorDocument } from '$lib/models/creator';
import type { OperatorDocument } from '$lib/models/operator';
import type { TicketDocument } from '$lib/models/ticket';
import type { UserDocument } from '$lib/models/user';

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      redisConnection: IORedis;
      user?: UserDocument;
      creator?: CreatorDocument;
      agent?: AgentDocument;
      operator?: OperatorDocument;
      ticket?: TicketDocument;
    }
    // interface Platform {}
    //interface Session {
    //}
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
  }
}
