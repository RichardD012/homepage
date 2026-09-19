// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";
import { expectBlockValue } from "test-utils/widget-assertions";

const { useWidgetAPI } = vi.hoisted(() => ({ useWidgetAPI: vi.fn() }));
vi.mock("utils/proxy/use-widget-api", () => ({ default: useWidgetAPI }));

import Component from "./component";

describe("widgets/bindery/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholders while loading", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "bindery" } }} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(3);
    expect(screen.getByText("bindery.wanted")).toBeInTheDocument();
    expect(screen.getByText("bindery.queued")).toBeInTheDocument();
    expect(screen.getByText("bindery.books")).toBeInTheDocument();
  });

  it("renders counts when loaded", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "wanted") return { data: { total: 2 }, error: undefined };
      if (endpoint === "queue") return { data: { totalRecords: 3 }, error: undefined };
      if (endpoint === "books") return { data: { total: 10 }, error: undefined };
      return { data: undefined, error: undefined };
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "bindery" } }} />, {
      settings: { hideErrors: false },
    });

    expectBlockValue(container, "bindery.wanted", 2);
    expectBlockValue(container, "bindery.queued", 3);
    expectBlockValue(container, "bindery.books", 10);
  });

  it("renders only the configured fields", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "wanted") return { data: { total: 2 }, error: undefined };
      if (endpoint === "queue") return { data: { totalRecords: 3 }, error: undefined };
      if (endpoint === "books") return { data: { total: 10 }, error: undefined };
      return { data: undefined, error: undefined };
    });

    const { container } = renderWithProviders(
      <Component service={{ widget: { type: "bindery", fields: ["books"] } }} />,
      { settings: { hideErrors: false } },
    );

    expect(container.querySelectorAll(".service-block")).toHaveLength(1);
    expectBlockValue(container, "bindery.books", 10);
  });

  it("renders an error when a call fails", () => {
    useWidgetAPI.mockImplementation((_widget, endpoint) => {
      if (endpoint === "queue") return { data: undefined, error: { message: "nope" } };
      return { data: { total: 1 }, error: undefined };
    });

    const { container } = renderWithProviders(<Component service={{ widget: { type: "bindery" } }} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(0);
  });
});
