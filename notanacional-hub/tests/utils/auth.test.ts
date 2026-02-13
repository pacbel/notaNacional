import { describe, expect, it } from "vitest";
import { extractUserFromToken } from "@/utils/auth";

const buildToken = (payload: Record<string, unknown>) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe("extractUserFromToken", () => {
  it("should extract basic fields", () => {
    const token = buildToken({ sub: "123", name: "Fulano", email: "fulano@teste.com", roles: ["Administrador"] });
    const user = extractUserFromToken(token);

    expect(user).not.toBeNull();
    expect(user?.id).toBe("123");
    expect(user?.roles).toEqual(["Administrador"]);
  });

  it("should handle missing roles", () => {
    const token = buildToken({ sub: "123" });
    const user = extractUserFromToken(token);

    expect(user).not.toBeNull();
    expect(user?.roles).toEqual(["Robot"]);
  });

  it("should return null when subject is missing", () => {
    const token = buildToken({ name: "Fulano" });
    const user = extractUserFromToken(token);

    expect(user).toBeNull();
  });
});
