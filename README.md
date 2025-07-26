# 🔧 Getting Started with Queuebase

Queuebase lets you publish and consume events via secure webhooks. Here's how to integrate it in your Node app.

---

## Prerequisites

- You have signed up for Queuebase
- You created both a project and a queue
- You have your API key and secret key
- Ngrok is installed (local development only)

## 📦 1. Install the SDK

```bash
npm install @queuebase/queuebase-js
```

## ↗️ 2. Publishing Events

Add your API key to your environment variables

```env
QUEUEBASE_API_KEY="<YOUR-API-KEY>"
```

Next, create your client

```ts
// lib/queuebase.ts
import { createClient } from "@queuebase/queuebase-js";

if (!process.env.QUEUEBASE_API_KEY) {
  throw new Error("QUEUEBASE_API_KEY is not set in the environment variables.");
}

export const queuebase = createClient(process.env.QUEUEBASE_API_KEY);
```

Now, you can use your client to publish events

```ts
import { queuebase } from "@/lib/queuebase"

async function helloQueuebase(name: string) {
  await queuebase.publish("say.hello", {
    name
  });
}
```

## 📥 3. Consuming events

Within the same (or completely different) app, we need to create our route handlers

```ts
// lib/queuebase-options.ts
import { QueuebaseRouterOptions } from "@queuebase/queuebase-js";

export const options: QueuebaseRouterOptions = {
  handlers: {
    "say.hello": async ({ payload }) => {
      const { name } = payload;
      if (!name) {
        throw new Error("Name is missing!");
      }

      console.log(`Hello from Queuebase, ${name}!`);
    },
  },
};
```

With the route handlers setup, we can now setup our endpoints

### With Next.js

Create a new route handler

```ts
// api/queuebase/route.ts
import { options } from "@/lib/queuebase-options";
import { verifySignature } from "@queuebase/queuebase-js";
import { NextRequest, NextResponse } from 'next/server'

export const POST = async (req: NextRequest) => {
  try {
    const headersList = await headers();
    const signature = headersList.get('x-queuebase-signature');

    if (!signature || typeof signature !== "string") {
      return NextResponse.json({ error: "Missing signature header" }, { status: 400 });
    }

    const isValid = verifySignature({
      signature,
      rawBody: JSON.stringify(req.body),
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const res = await req.json()
    const handler = options.handlers[res.event];

    if (!handler) {
      return NextResponse.json({ error: `No handler for event: ${res}` }, { status: 400 });
    }

    try {
      await handler({ payload: req.body.payload });
      return NextResponse.json({ success: true }, { status: 200});
    } catch (err) {
      console.error("Error handling event", err);
      throw err;
    }
  } catch (err) {
    console.error("Error in Queuebase", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

### With Express

Create a new route handler

```ts
// routers/queuebase.route.ts
import { options } from "@/lib/queuebase-options";
import { verifySignature } from "@queuebase/queuebase-js";
import { Router } from "express";

const router: Router = Router();

router.post("/queuebase", async (req, res, next) => {
  try {
    const signature = req.headers["x-queuebase-signature"];

    if (!signature || typeof signature !== "string") {
      res.status(400).send({ error: "Missing signature header" });
      return;
    }

    const isValid = verifySignature({
      signature,
      rawBody: JSON.stringify(req.body),
    });

    if (!isValid) {
      res.status(401).send({ error: "Invalid signature" });
      return;
    }

    const handler = options.handlers[req.body.event];

    if (!handler) {
      res
        .status(400)
        .send({ error: `No handler for event: ${req.body.event}` });
      return;
    }

    try {
      await handler({ payload: req.body.payload });
      res.status(200).send({ success: true });
    } catch (err) {
      console.error("Error handling event", err);
      res.status(500).send({ error: "Internal Server Error" });
    }
  } catch (err) {
    console.error("Error in Queuebase middleware", err);
    next(err);
  }
});

export { router as queuebaseRouter };
```

Then, register your router like so

```ts
// main.ts
import "dotenv/config";
import express, { Router } from "express";
import { queuebaseRouter } from "./routers/queuebase.router";

const app = express();

app.use(express.json());

app.use("/queuebase", queuebaseRouter);
```
