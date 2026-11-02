"""Real Chromium layout regression; no project dependencies required.

Start `pnpm dev --host 0.0.0.0 --port 5173`, then run with Hermes
browser_exec (helpers new_tab, goto_url, js, fill_input, cdp are injected):
    exec(open('/root/algo-visualizer/scripts/array-dom-regression.py').read())
    run_array_regression(width=1280, height=720)
Repeat for (1440, 1000) and (390, 844). Optional base_url / evidence_path
arguments support another server and persistent JSON evidence. Raises on any
clipped default/8-item node or pointer, missing bounds, page overflow, or
unusable 12-item internal scrolling. Desktop navigation stays open.
"""
import json
import os
import time
from typing import Any, Callable

# Provided by browser_exec; annotations make the injected contract explicit.
cdp: Callable[..., Any]
new_tab: Callable[..., Any]
goto_url: Callable[..., Any]
js: Callable[..., Any]
fill_input: Callable[..., Any]

ROUTES = ('binary-search', 'bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort')
MEASURE = """(() => {
 const stage = document.querySelector('[data-animation-stage]');
 if (!stage) throw Error('Missing animation stage');
 const viewport = stage.closest('[data-radix-scroll-area-viewport]');
 const rect = el => { const r = el.getBoundingClientRect(); return {left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height}; };
 return {url:location.href, viewport:rect(viewport), stage:rect(stage),
   composition:rect(document.querySelector('[data-array-composition]') || stage),
   legend:document.querySelector('[aria-label="图例"]') ? rect(document.querySelector('[aria-label="图例"]')) : null,
   scrollWidth:viewport.scrollWidth, clientWidth:viewport.clientWidth, scrollLeft:viewport.scrollLeft,
   pageWidth:document.documentElement.scrollWidth, windowWidth:innerWidth,
   nodes:[...stage.querySelectorAll('[data-node-id]')].map(el=>({id:el.dataset.nodeId,...rect(el)})),
   pointers:[...stage.querySelectorAll('[data-pointer]')].map(el=>({name:el.dataset.pointer,...rect(el)}))};
})()"""


def run_array_regression(width, height, base_url='http://127.0.0.1:5173/', evidence_path=None):
    evidence_path = evidence_path or os.path.join(os.environ['BH_AGENT_WORKSPACE'], 'array-dom-results.json')
    records = []
    failures = []
    new_tab(base_url + '#/binary-search')
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=1, mobile=False)
    time.sleep(0.8)
    assert js('innerWidth') == width and js('innerHeight') == height, 'Viewport override did not apply'
    # Explicitly keep the desktop sidebar open (do not open the mobile overlay).
    if width >= 768:
        if js("document.querySelector('[data-state=collapsed][data-side]') !== null"):
            js("document.querySelector('[aria-label=\"切换导航\"]').click()")
            time.sleep(0.3)
    for route in ROUTES:
        # Force a document load so each topic starts with its own default input.
        goto_url(base_url + '?array-regression=' + route + '#/' + route)
        for _ in range(50):
            if js("Boolean(document.querySelector('[data-animation-stage]'))"):
                break
            time.sleep(0.1)
        time.sleep(0.3)
        for count in (None, 8, 12):
            if count:
                fill_input('#values', ', '.join(str(i + 1) for i in range(count)))
                js("[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==='应用').click()")
                time.sleep(0.35)
            result = js(MEASURE)
            result.update(screen=[width, height], route=route, input=count or 'default')
            records.append(result)
            context = f'{width}x{height}/{route}/{count or "default"}'
            expected = count or len(js("document.querySelector('#values').value.split(',')"))
            if len(result['nodes']) != expected:
                failures.append(f'{context}: expected {expected} nodes, got {len(result["nodes"])}')
            if not {'low', 'high'}.issubset({p['name'] for p in result['pointers']}):
                failures.append(f'{context}: missing low/high boundary pointers')
            if result['pageWidth'] > width:
                failures.append(f'{context}: page overflow {result["pageWidth"]}')
            if count != 12:
                viewport = result['viewport']
                for item in result['nodes'] + result['pointers']:
                    if (item['left'] < viewport['left'] - 0.5 or item['right'] > viewport['right'] + 0.5
                            or item['top'] < viewport['top'] - 0.5 or item['bottom'] > viewport['bottom'] + 0.5):
                        failures.append(f'{context}: clipped {item}')
                if result['scrollLeft'] != 0 or result['scrollWidth'] > result['clientWidth'] + 1:
                    failures.append(f'{context}: ordinary array requires horizontal scrolling')
                if result['legend'] and abs(result['legend']['top'] - result['stage']['bottom'] - 8) > 1:
                    failures.append(f'{context}: legend gap changed from 8px')
                if abs((result['stage']['left'] + result['stage']['right']) / 2 - (viewport['left'] + viewport['right']) / 2) > 1:
                    failures.append(f'{context}: SVG is not horizontally centered')
            else:
                result['scrolled'] = js("(() => { const v=document.querySelector('[data-animation-stage]').closest('[data-radix-scroll-area-viewport]'); v.scrollLeft=v.scrollWidth; return v.scrollLeft; })()")
                if result['scrollWidth'] <= result['clientWidth'] or result['scrolled'] <= 0:
                    failures.append(f'{context}: long array cannot scroll')
                end = js(MEASURE)
                last = end['nodes'][-1]
                if last['right'] > end['viewport']['right'] + 0.5:
                    failures.append(f'{context}: last node unreachable after scrolling')
    previous = []
    if os.path.exists(evidence_path):
        with open(evidence_path) as source:
            previous = json.load(source)
    with open(evidence_path, 'w') as target:
        json.dump(previous + records, target, indent=2)
    print(json.dumps({'screen':[width,height], 'cases':len(records), 'failures':failures, 'evidence':evidence_path}, ensure_ascii=False))
    assert not failures, '\n'.join(failures)
    return records
