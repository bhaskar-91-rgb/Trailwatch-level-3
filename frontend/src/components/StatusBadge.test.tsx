import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";
import { ConditionBadge } from "./ConditionBadge";

describe("StatusBadge", () => {
  it("renders Pending status", () => {
    render(<StatusBadge status="Pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
  it("renders Confirmed status", () => {
    render(<StatusBadge status="Confirmed" />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });
  it("renders Disputed status", () => {
    render(<StatusBadge status="Disputed" />);
    expect(screen.getByText("Disputed")).toBeInTheDocument();
  });
});

describe("ConditionBadge", () => {
  it("renders Washout condition", () => {
    render(<ConditionBadge condition="Washout" />);
    expect(screen.getByText("Washout")).toBeInTheDocument();
  });
  it("renders Clear condition", () => {
    render(<ConditionBadge condition="Clear" />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });
});
