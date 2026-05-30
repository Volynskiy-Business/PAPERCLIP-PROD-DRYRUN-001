import { randomUUID } from "node:crypto";

export function createStore() {
  const prospects = new Map();

  return {
    async list() {
      return Array.from(prospects.values());
    },

    async create(input) {
      if (!input.name) {
        throw new Error("name is required");
      }
      const prospect = {
        id: randomUUID(),
        name: input.name,
        source: input.source,
        status: input.status,
        auditEvents: [
          {
            type: "created",
            at: new Date().toISOString()
          }
        ]
      };
      prospects.set(prospect.id, prospect);
      return prospect;
    },

    async update(id, patch) {
      const prospect = prospects.get(id);
      if (!prospect) {
        throw new Error("prospect not found");
      }
      prospect.status = patch.status;
      prospect.auditEvents.push({
        type: "status_changed",
        status: patch.status,
        at: new Date().toISOString()
      });
      return prospect;
    }
  };
}

