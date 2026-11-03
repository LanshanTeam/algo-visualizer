import { describe, expect, it } from "vitest";
import type { Frame } from "../core/types";
import { createAnimationScene, sampleTrack } from "./animation-scene";
import { overlaps } from "./animation-scene.test-helpers";
import { insertionSortTrace } from "../topics/sorting-searching/insertion-sort";
import { mergeSortTrace } from "../topics/sorting-searching/merge-sort";
const a = { id: 0, value: 8 }, b = { id: 1, value: 3 }, c = { id: 2, value: 5 };
const base: Frame = { items: [a,b,c], active: [], settled: [], pointers: {}, anchor: "init", narration: "", variables: {}, stack: [] };
const scene = (frame: Frame, previous?: Frame) => createAnimationScene({frame, previous, kind: "array", capacity: 3});
describe("extended array scenes", () => {
  it("enlarges default array nodes and text about 10% in constrained canvases without changing linked lists", () => {
    const items = Array.from({length: 7}, (_, id) => ({id, value: id}));
    const result = createAnimationScene({frame: {...base, items}, kind: "array", capacity: 7});
    for (const viewport of [506, 430]) {
      const before = viewport / 570;
      const after = viewport / result.width;
      expect(after / before).toBeGreaterThan(1.08);
      expect(after / before).toBeLessThan(1.12);
      expect(result.nodes[0].width).toBe(58);
      expect(result.nodes[0].fontSize).toBe(25);
    }
    expect(result.slots[1].x - result.slots[0].x - result.nodes[0].width).toBeGreaterThanOrEqual(10);
    const linked = createAnimationScene({frame: base, kind: "linked-list", capacity: 5});
    expect(linked.width).toBe(656);
    expect(linked.nodes[0].width).toBe(80);
  });
  it("keeps real sorting traces and visible labels collision-free forward, backward and on seeks", () => {
    for (const frames of [insertionSortTrace([9,7,5,3,1]), mergeSortTrace([9,7,5,3,1])]) {
    for (let i=0;i<frames.length;i++) for (const previous of [undefined, frames[i-1], frames[i+1]]) {
      const result = createAnimationScene({frame:frames[i], previous, kind:"array", capacity:5});
      expect(result.height).toBe(frames[i].auxiliary ? 284 : 208);
      for (let tick=0;tick<=100;tick++) {
        const t=tick/100;
        const nodes=result.nodes.map(n=>({...n,x:sampleTrack(n.x,result.times,t),y:sampleTrack(n.y,result.times,t)}));
        const labels=[...result.indices.map(n=>({x:n.x-8,y:n.y-12,width:16,height:16,hidden:n.revealAfterMotion})),...result.pointers.map(p=>({x:sampleTrack(p.x,result.times,t)-p.width/2,y:sampleTrack(p.y,result.times,t)-27,width:p.width,height:34,hidden:p.revealAfterMotion}))];
        nodes.forEach((node,index)=>{
          nodes.slice(index+1).forEach(other=>{
            if (overlaps(node,other)) throw new Error(`${frames[i].anchor} / ${previous?.anchor} at ${t}: nodes overlap`);
          });
          labels.filter(l=>!l.hidden||t===1).forEach(label=>{
            if (overlaps(node,label)) throw new Error(`${frames[i].anchor} at ${t}: label overlap`);
          });
        });
      }
    }
    }
  });
  it("shows auxiliary copies in a separate labeled row and replays writes with the scene clock", () => {
    const empty: Frame = {...base, auxiliary: {label: "辅助数组", slots: [null,null,null]}};
    const write: Frame = {...empty, auxiliary: {label: "辅助数组", slots: [b,null,null]}};
    const result = scene(write, empty);
    expect(result.auxiliary?.label).toBe("辅助数组");
    expect(result.auxiliary?.slots).toHaveLength(3);
    expect(result.auxiliary?.nodes[0].id).toBe(b.id);
    expect(result.auxiliary?.nodes[0].opacity).toEqual([0,0,1,1]);
    const auxiliary = result.auxiliary!;
    // Label remains below the pointer badges (bottom y=177), but no distant empty row.
    expect(auxiliary.labelY - 12).toBeGreaterThan(177);
    expect(auxiliary.slots[0].y).toBeLessThanOrEqual(208);
    expect(auxiliary.slots[0].y).toBeGreaterThan(result.slots[0].y+100);
    expect(result.height).toBe(auxiliary.slots[0].y + 52 + 16 + 8);
    expect(result.hasMotion).toBe(true);
    expect(result.nodes.map(n=>n.x.at(-1))).toEqual(scene(empty).nodes.map(n=>n.x.at(-1)));
    expect(scene(empty, write).auxiliary?.nodes[0].opacity).toEqual([1,1,0,0]);
    expect(scene(write).auxiliary?.nodes[0].opacity).toEqual([1,1,1,1]);
    expect(scene(empty).height).toBe(result.height);
    expect(scene(base).height).toBe(208);
    const committed: Frame = {...empty, anchor: "copy", items: [b,c,a]};
    const commit = scene(committed, {...write, anchor: "write", auxiliary: {label:"辅助数组",slots:[b,c,a]}});
    expect(commit.nodes.every(n=>new Set(n.x).size===1)).toBe(true);
    expect(commit.hasMotion).toBe(true);
  });
  it("keeps insertion shifts on the main row and held travel clear in both directions", () => {
    const frames: Frame[] = [
      {...base, arraySlots: [a,b,c]},
      {...base, arraySlots: [a,null,c], held: b},
      {...base, arraySlots: [null,a,c], held: b},
      {...base, items: [b,a,c], arraySlots: [b,a,c]},
    ];
    for (const frame of frames) {
      // A held value uses the existing upper lane, not a phantom auxiliary row.
      expect(scene(frame).height).toBe(208);
      for (const previous of frames) {
        const result = scene(frame, previous);
        for (let tick=0; tick<=100; tick++) {
          const nodes = result.nodes.map(node => ({...node, x: sampleTrack(node.x,result.times,tick/100), y: sampleTrack(node.y,result.times,tick/100)}));
          nodes.forEach((node,index) => {
            expect(node.y).toBeGreaterThanOrEqual(0);
            expect(node.y+node.height).toBeLessThanOrEqual(result.height);
            nodes.slice(index+1).forEach(other => expect(overlaps(node,other)).toBe(false));
          });
        }
      }
    }
    const shift = scene(frames[2], frames[1]).nodes.find(n=>n.id===a.id)!;
    expect(new Set(shift.y).size).toBe(1);
  });
  it("never draws an empty binary-search interval, including legacy variable ranges", () => {
    expect(scene({...base, range: {low: 2, high: 0}}).range).toBeUndefined();
    expect(scene({...base, variables: {low: 2, high: 0}}).range).toBeUndefined();
    expect(scene({...base, range: {low: 0, high: 1}}).range?.width).toBeGreaterThan(0);
  });
  it("maps holes and pointers by physical slots, keeping the held identity above the row", () => {
    const frame: Frame = {...base, arraySlots: [null,a,c], held: b, pointers: { hole: 0, j: 1 }, active: [1]};
    const result = scene(frame);
    expect(result.nodes.find(n => n.id === a.id)?.x.at(-1)).toBe(result.slots[1].x);
    expect(result.nodes.find(n => n.id === a.id)?.tone).toBe("active");
    expect(result.nodes.find(n => n.id === b.id)!.y.at(-1)! + 52).toBeLessThan(result.slots[0].y);
    expect(result.indices.map(n=>n.index)).toEqual([0,1,2]);
    expect(result.pointers.find(p=>p.name === "j")?.targetId).toBe(a.id);
    expect(result.pointers.find(p=>p.name === "hole")?.targetId).toBeUndefined();
    expect(result.pointers.find(p=>p.name === "hole")?.x.at(-1)).toBe(result.slots[0].x + 29);
  });
});
