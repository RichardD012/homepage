import { describe, expect, it } from "vitest";

import { expectWidgetConfigShape } from "test-utils/widget-config";

import widget from "./widget";

describe("bindery widget config", () => {
  it("exports a valid widget config", () => {
    expectWidgetConfigShape(widget);
  });

  it("maps the paginated book list down to its unpaged total", () => {
    const page = Buffer.from(JSON.stringify({ items: [{ id: 1 }], total: 42, limit: 1, offset: 0 }));

    expect(widget.mappings.wanted.map(page)).toEqual({ total: 42 });
    expect(widget.mappings.books.map(page)).toEqual({ total: 42 });
  });

  it("falls back to zero when the book list cannot be read", () => {
    expect(widget.mappings.books.map(Buffer.from(""))).toEqual({ total: 0 });
  });

  it("reaches the queue outside the versioned API tree", () => {
    expect(widget.api).toBe("{url}/api/{endpoint}?apikey={key}");
    expect(widget.mappings.queue.endpoint).toBe("queue?pageSize=1");
    expect(widget.mappings.wanted.endpoint).toBe("v1/book?status=wanted&limit=1");
    expect(widget.mappings.books.endpoint).toBe("v1/book?status=imported&limit=1");
  });
});
