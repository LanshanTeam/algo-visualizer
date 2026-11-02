import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnimationCanvas } from "./animation-canvas";
import type { Frame } from "../core/types";
const item = {id: 0, value: 7};
const base: Frame = {items: [item], active: [], settled: [], pointers: {}, anchor: "", narration: "", variables: {}, stack: []};
const render = (frame: Frame) => renderToStaticMarkup(<AnimationCanvas frame={frame} linked={false} capacity={1} duration={1}/>);
describe("extended array canvas", () => {
  it("renders auxiliary row, slots and copies with distinct DOM identities", () => {
    const html = render({...base, auxiliary: {label: "辅助数组", slots: [item]}});
    expect(html).toContain("辅助数组");
    expect(html).toContain('data-auxiliary-node-id="0"');
    expect(html).toContain('data-auxiliary-slot="0"');
    expect(html.match(/data-node-id="0"/g)).toHaveLength(1);
  });
  it("labels the held value without cloning the main identity", () => {
    const html = render({...base,arraySlots:[null],held:item});
    expect(html).toContain("暂存");
    expect(html.match(/data-node-id="0"/g)).toHaveLength(1);
  });
});
