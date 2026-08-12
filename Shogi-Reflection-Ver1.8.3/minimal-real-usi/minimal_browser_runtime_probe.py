from __future__ import annotations
import json, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent
OUT_JSON=ROOT/'MINIMAL_BROWSER_RUNTIME_RESULT.json'
OUT_TXT=ROOT/'MINIMAL_BROWSER_RUNTIME_RESULT.txt'

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Opener-Policy','same-origin')
        self.send_header('Cross-Origin-Embedder-Policy','require-corp')
        self.send_header('Cross-Origin-Resource-Policy','same-origin')
        super().end_headers()
    def log_message(self, fmt, *args): pass

def main()->int:
    server=ThreadingHTTPServer(('127.0.0.1',0),lambda *a,**k:Handler(*a,directory=str(ROOT),**k))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    base=f'http://127.0.0.1:{server.server_port}'
    result={'schemaVersion':1,'harness':'YaneuraOu Minimal Runtime Gate / Browser','passed':False,'status':'NOT_RUN','crossOriginIsolated':False,'sharedArrayBuffer':False,'console':[],'pageErrors':[]}
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(headless=True)
            page=browser.new_page(viewport={'width':390,'height':844})
            page.on('console',lambda m:result['console'].append({'type':m.type,'text':m.text,'location':m.location}))
            page.on('pageerror',lambda e:result['pageErrors'].append(str(e)))
            page.goto(base+'/runtime_gate.html',wait_until='load')
            result['crossOriginIsolated']=page.evaluate('crossOriginIsolated===true')
            result['sharedArrayBuffer']=page.evaluate("typeof SharedArrayBuffer === 'function'")
            page.wait_for_function('window.minimalRuntimeGate && window.minimalRuntimeGate.state.done === true',timeout=35000)
            state=page.evaluate('window.minimalRuntimeGate.state')
            events=page.evaluate('window.minimalRuntimeGate.events')
            errors=page.evaluate('window.minimalRuntimeGate.errors')
            info_lines=page.evaluate('window.minimalRuntimeGate.infoLines')
            result.update(state)
            result['events']=events[-220:]
            result['errors']=errors
            result['infoTail']=info_lines[-160:]
            if result['pageErrors']:
                result['passed']=False
                result['status']='PAGE_ERROR'
            if not result['crossOriginIsolated'] or not result['sharedArrayBuffer']:
                result['passed']=False
                result['status']='ISOLATION_REQUIRED'
            browser.close()
    except Exception as exc:
        result['passed']=False; result['status']='PROBE_EXCEPTION'; result.setdefault('errors',[]).append(repr(exc))
    finally:
        server.shutdown(); server.server_close()
    OUT_JSON.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    lines=['YaneuraOu Minimal Runtime Gate — Browser','=========================================',f"Status: {result.get('status')}",f"Passed: {result.get('passed')}",f"crossOriginIsolated: {result.get('crossOriginIsolated')}",f"SharedArrayBuffer: {result.get('sharedArrayBuffer')}",f"usiok: {result.get('usiok')}",f"readyok: {result.get('readyok')}",f"MultiPV ids: {result.get('multipv',{}).get('ids')}",f"stop bestmove: {result.get('stop',{}).get('bestmove')}",f"reanalysis bestmove: {result.get('reanalysis',{}).get('bestmove')}",f"mate observed: {result.get('mate',{}).get('mateObserved')}",f"mate score: {result.get('mate',{}).get('mateScore')}",f"quit sent: {result.get('quitSent')}",'','Page errors:',*(result.get('pageErrors') or ['(none)']),'','Errors:',*[json.dumps(x,ensure_ascii=False) for x in (result.get('errors') or ['(none)'])],'','Event tail:',*(result.get('events') or [])]
    OUT_TXT.write_text('\n'.join(map(str,lines))+'\n',encoding='utf-8')
    return 0 if result.get('passed') else 1

if __name__=='__main__':
    raise SystemExit(main())
