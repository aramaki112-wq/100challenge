from __future__ import annotations
import json
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
RESULT_JSON = ROOT / 'MINIMAL_BROWSER_SEARCH_RESULT.json'
RESULT_TXT = ROOT / 'MINIMAL_BROWSER_SEARCH_RESULT.txt'

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass

def main() -> int:
    server = ThreadingHTTPServer(
        ('127.0.0.1', 0),
        lambda *a, **k: Handler(*a, directory=str(ROOT), **k),
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'

    result = {
        'schemaVersion': 1,
        'harness': 'YaneuraOu Minimal Real Search / Browser',
        'passed': False,
        'status': 'NOT_RUN',
        'command': 'go nodes 5000',
        'crossOriginIsolated': False,
        'sharedArrayBuffer': False,
        'moduleReady': False,
        'usiok': False,
        'readyok': False,
        'searchStarted': False,
        'infoCount': 0,
        'scoreObserved': False,
        'scoreType': '',
        'score': None,
        'depthObserved': False,
        'depth': None,
        'nodesObserved': False,
        'nodes': None,
        'timeObserved': False,
        'timeMs': None,
        'pvObserved': False,
        'pv': '',
        'bestmoveObserved': False,
        'bestmove': '',
        'ponder': '',
        'searchMs': None,
        'errors': [],
        'events': [],
        'infoLines': [],
        'console': [],
        'pageErrors': [],
    }

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width':390, 'height':844})
            page.on('console', lambda msg: result['console'].append({
                'type': msg.type,
                'text': msg.text,
                'location': msg.location,
            }))
            page.on('pageerror', lambda exc: result['pageErrors'].append(str(exc)))
            page.goto(base + '/index.html', wait_until='load')
            result['crossOriginIsolated'] = page.evaluate('crossOriginIsolated === true')
            result['sharedArrayBuffer'] = page.evaluate("typeof SharedArrayBuffer === 'function'")

            deadline = time.time() + 30
            while time.time() < deadline:
                state = page.evaluate('window.minimalUsiHarness?.state || {}')
                errors = page.evaluate('window.minimalUsiHarness?.errors || []')
                if errors:
                    result['errors'] = errors
                    break
                if state.get('bestmoveObserved'):
                    break
                time.sleep(0.05)

            result['events'] = page.evaluate('window.minimalUsiHarness?.events || []')[-250:]
            result['infoLines'] = page.evaluate('window.minimalUsiHarness?.infoLines || []')[-100:]
            result['errors'] = page.evaluate('window.minimalUsiHarness?.errors || []')[-100:]
            state = page.evaluate('window.minimalUsiHarness?.state || {}')

            for key in (
                'moduleReady','usiok','readyok','searchStarted','scoreObserved',
                'depthObserved','nodesObserved','timeObserved','pvObserved','bestmoveObserved'
            ):
                result[key] = bool(state.get(key))
            for key in ('infoCount','score','depth','nodes','timeMs'):
                result[key] = state.get(key)
            for key in ('scoreType','pv','bestmove','ponder'):
                result[key] = state.get(key) or ''

            started = state.get('searchStartedAt')
            ended = state.get('bestmoveAt')
            if isinstance(started, (int, float)) and isinstance(ended, (int, float)):
                result['searchMs'] = max(0, round(ended - started, 3))

            result['passed'] = all([
                result['crossOriginIsolated'],
                result['sharedArrayBuffer'],
                result['moduleReady'],
                result['usiok'],
                result['readyok'],
                result['searchStarted'],
                result['infoCount'] > 0,
                result['scoreObserved'],
                result['depthObserved'],
                result['nodesObserved'],
                result['timeObserved'],
                result['pvObserved'],
                result['bestmoveObserved'],
                bool(result['bestmove']),
                not result['errors'],
                not result['pageErrors'],
            ])
            result['status'] = 'PASS_MINIMAL_SEARCH' if result['passed'] else 'MINIMAL_SEARCH_FAILED'
            browser.close()
    except Exception as exc:
        result['status'] = 'HARNESS_EXCEPTION'
        result['errors'].append({'type':'python-exception', 'message':str(exc)})
    finally:
        server.shutdown()
        server.server_close()

    RESULT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    RESULT_TXT.write_text('\n'.join([
        'YaneuraOu Minimal Real Search Harness — Browser',
        '================================================',
        f"Status: {result['status']}",
        f"Passed: {str(result['passed']).lower()}",
        f"crossOriginIsolated: {result['crossOriginIsolated']}",
        f"SharedArrayBuffer: {result['sharedArrayBuffer']}",
        f"usiok: {result['usiok']}",
        f"readyok: {result['readyok']}",
        f"infoCount: {result['infoCount']}",
        f"score: {result['scoreType']} {result['score']}",
        f"depth: {result['depth']}",
        f"nodes: {result['nodes']}",
        f"timeMs: {result['timeMs']}",
        f"pv: {result['pv']}",
        f"bestmove: {result['bestmove']}",
        f"ponder: {result['ponder']}",
        f"searchMs: {result['searchMs']}",
        '',
        'Errors:', json.dumps(result['errors'], ensure_ascii=False, indent=2),
        '',
        'Page errors:', json.dumps(result['pageErrors'], ensure_ascii=False, indent=2),
        '',
        'Info lines:', *result['infoLines'],
        '',
        'Events:', *result['events'],
        '',
    ]), encoding='utf-8')
    print(RESULT_TXT.read_text(encoding='utf-8'))
    return 0 if result['passed'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
