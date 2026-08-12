from __future__ import annotations
import json, threading, time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
RESULT_JSON = ROOT / 'MINIMAL_BROWSER_USI_RESULT.json'
RESULT_TXT = ROOT / 'MINIMAL_BROWSER_USI_RESULT.txt'

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'same-origin')
        super().end_headers()
    def log_message(self, fmt, *args):
        pass

def main() -> int:
    server = ThreadingHTTPServer(('127.0.0.1', 0), lambda *a, **k: Handler(*a, directory=str(ROOT), **k))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    result = {
        'schemaVersion': 1,
        'harness': 'YaneuraOu Minimal Real USI / Browser',
        'passed': False,
        'status': 'NOT_RUN',
        'crossOriginIsolated': False,
        'sharedArrayBuffer': False,
        'moduleReady': False,
        'usiok': False,
        'readyok': False,
        'errors': [],
        'events': [],
        'console': [],
        'pageErrors': [],
    }
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width':390, 'height':844})
            page.on('console', lambda msg: result['console'].append({'type':msg.type, 'text':msg.text, 'location':msg.location}))
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
                if state.get('readyok'):
                    break
                time.sleep(0.05)
            result['events'] = page.evaluate('window.minimalUsiHarness?.events || []')[-200:]
            result['errors'] = page.evaluate('window.minimalUsiHarness?.errors || []')[-100:]
            state = page.evaluate('window.minimalUsiHarness?.state || {}')
            for key in ('moduleReady','usiok','readyok'):
                result[key] = bool(state.get(key))
            result['passed'] = result['usiok'] is True
            result['status'] = 'PASS_USIOK' if result['usiok'] else 'USIOK_FAILED'
            browser.close()
    except Exception as exc:
        result['status'] = 'HARNESS_EXCEPTION'
        result['errors'].append({'type':'python-exception', 'message':str(exc)})
    finally:
        server.shutdown(); server.server_close()

    RESULT_JSON.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    RESULT_TXT.write_text('\n'.join([
        'YaneuraOu Minimal Real USI Harness — Browser',
        '============================================',
        f"Status: {result['status']}",
        f"Passed usi->usiok: {str(result['passed']).lower()}",
        f"crossOriginIsolated: {result['crossOriginIsolated']}",
        f"SharedArrayBuffer: {result['sharedArrayBuffer']}",
        f"Module ready: {result['moduleReady']}",
        f"usiok: {result['usiok']}",
        f"readyok: {result['readyok']}",
        '', 'Errors:', json.dumps(result['errors'], ensure_ascii=False, indent=2),
        '', 'Events:', *result['events'], ''
    ]), encoding='utf-8')
    print(RESULT_TXT.read_text(encoding='utf-8'))
    return 0 if result['passed'] else 1

if __name__ == '__main__':
    raise SystemExit(main())
