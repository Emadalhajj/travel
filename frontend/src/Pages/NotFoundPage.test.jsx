import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import "../i18n";
import NotFoundPage from "./NotFoundPage";

test("unknown routes render an accessible localized recovery page", () => {
  render(<MemoryRouter><NotFoundPage /></MemoryRouter>);
  expect(screen.getByRole("heading", { name: "Page not found" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Back to home" }).getAttribute("href")).toBe("/");
});
