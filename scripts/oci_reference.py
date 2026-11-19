"""Read command signatures from the public OCI reference. No OCI API is called."""
import argparse
import json
import re
import sys
import urllib.request
from urllib.parse import urljoin
from html.parser import HTMLParser
from pathlib import Path

BASE = 'https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/'
ROOT = Path(__file__).resolve().parents[1]
SERVICES = {'os': 'Object Storage', 'db': 'Database', 'bv': 'Block Volume', 'fs': 'File Storage',
            'monitoring': 'Monitoring', 'mysql': 'MySQL', 'ce': 'Kubernetes Engine',
            'streaming': 'Streaming', 'queue': 'Queue', 'artifacts': 'Artifact Registry'}
STARTERS = [
    ('os/bucket/list', 'List Object Storage Buckets'),
    ('db/autonomous-database/list', 'List Autonomous Databases'),
    ('bv/backup/list', 'List Block Volume Backups'),
    ('fs/file-system/list', 'List File Systems'),
    ('monitoring/alarm/list', 'List Monitoring Alarms'),
    ('bv/volume/list', 'List Block Volumes'),
    ('db/db-system/list', 'List Database Systems'),
    ('fs/snapshot/list', 'List File System Snapshots'),
    ('ce/cluster/list', 'List Kubernetes Clusters'),
    ('db/db-home/list', 'List Database Homes'),
    ('os/object/list', 'List Object Storage Objects'),
    ('bv/volume-group/list', 'List Volume Groups')
]
OPTION = re.compile(r'--[a-z][a-z0-9-]*')
SAFE_PATH = re.compile(r'[a-z0-9-]+(?:/[a-z0-9-]+)+/list')
EXCLUDE_RESOURCES = re.compile(r'credential|password|secret|identity|security|network|endpoint|certificate|token|wallet|permission|key-management')
OPTIONAL = {'--limit', '--display-name', '--name', '--namespace-name', '--bucket-name', '--prefix',
            '--compartment-id', '--availability-domain', '--page', '--volume-id', '--database-id'}

class Reference(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.section = ''
        self.capture = None
        self.buffer = []
        self.command = ''
        self.options = []
        self.links = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        ident = attrs.get('id', '')
        if tag in ('div', 'section') and (tag == 'section' or 'section' in attrs.get('class', '').split()):
            self.section = ident
        if tag == 'a':
            self.links.add(attrs.get('href', '').split('#')[0])
        if (tag == 'pre' and self.section == 'usage') or (tag == 'dt' and ident.startswith('cmdoption-') and self.section in ('required-parameters', 'optional-parameters')):
            self.capture, self.buffer = tag, []

    def handle_data(self, data):
        if self.capture:
            self.buffer.append(data)

    def handle_endtag(self, tag):
        if self.capture != tag:
            return
        text = ''.join(self.buffer).replace('¶', '').strip()
        if tag == 'pre':
            match = re.fullmatch(r'(oci(?: [a-z0-9-]+)+)\s+\[OPTIONS\]', text)
            if match:
                self.command = match.group(1)
        else:
            name, dtype = OPTION.search(text), re.search(r'\[([^\]]+)\]', text)
            if name:
                self.options.append((name.group(), dtype.group(1).lower() if dtype else 'switch', self.section == 'required-parameters'))
        self.capture = None

class DocumentationRedirects(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not urljoin(req.full_url, newurl).startswith(BASE):
            raise ValueError('Redirect outside the public Oracle CLI reference')
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch(path):
    url = BASE + path + '.html'
    request = urllib.request.Request(url, headers={'User-Agent': 'daily-cloud-tools/1.0'})
    with urllib.request.build_opener(DocumentationRedirects()).open(request, timeout=7) as response:
        if not response.geturl().startswith(BASE):
            raise ValueError('Unexpected documentation host or path')
        body = response.read(3_000_001)
    if len(body) > 3_000_000:
        raise ValueError('Page is too large')
    doc = Reference()
    doc.feed(body.decode('utf-8'))
    return doc

def load_spec(path, title=None):
    if not SAFE_PATH.fullmatch(path) or path.split('/')[0] not in SERVICES or EXCLUDE_RESOURCES.search(path):
        raise ValueError('Outside supported list command families')
    doc = fetch(path)
    command = ['oci'] + path.split('/')
    if doc.command.split() != command:
        raise ValueError('Reference usage does not match the expected command')
    flags = []
    for name, dtype, required in doc.options:
        if required and (dtype not in ('text','integer') or (dtype == 'text' and not name.endswith(('-id','-name','-domain','-namespace')))):
            raise ValueError('Required parameter needs a specialized editor')
        if required or (name in OPTIONAL and dtype in ('text','integer')):
            flags.append({'name':name, 'kind':dtype, 'required':required})
    if not any(f['required'] for f in flags):
        raise ValueError('Needs at least one explicit scope parameter')
    service = SERVICES[path.split('/')[0]]
    resource = ' '.join(path.split('/')[1:-1]).replace('-', ' ')
    return {'slug':'oci-' + path.replace('/','-'), 'title':title or (service+' '+resource+' list builder'),
            'category':'Oracle Cloud', 'summary':'Build the '+doc.command+' command with its documented scope and filters.',
            'command':command,'fields':flags,'source':BASE + path + '.html'}

def discover(used):
    # Rotate services by published reference count to vary the next tool.
    services = list(SERVICES)
    pivot = len([s for s in used if s.startswith('oci-')]) % len(services)
    for service in services[pivot:] + services[:pivot]:
        try:
            links = sorted(fetch(service).links)
        except (OSError, ValueError) as exc:
            print(service, str(exc), file=sys.stderr)
            continue
        fresh = [link[:-5] for link in links if link.startswith(service+'/') and link.endswith('/list.html')]
        attempts = 0
        for path in fresh:
            if not SAFE_PATH.fullmatch(path) or EXCLUDE_RESOURCES.search(path) or 'oci-'+path.replace('/','-') in used:
                continue
            if attempts >= 8:
                break
            attempts += 1
            try:
                return load_spec(path)
            except (OSError, ValueError) as exc:
                print(path, str(exc), file=sys.stderr)
    raise RuntimeError('No new compatible command found in the reachable Oracle reference. Add a recipe or check the source.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('mode', choices=['seed','next'])
    parser.add_argument('--site',type=Path,default=ROOT/'site')
    args = parser.parse_args()
    if args.mode == 'seed':
        for i, (path, title) in enumerate(STARTERS,1):
            try:
                spec = load_spec(path,title)
            except (OSError,ValueError) as exc:
                print(path, str(exc), file=sys.stderr)
                continue
            target = ROOT/'queue'/'oci'/('%02d-%s.json' % (i,spec['slug']))
            target.write_text(json.dumps(spec,indent=2)+'\n')
            print(path, len(spec['fields']), 'fields')
    else:
        used = {p.parent.name for p in (args.site/'apps').glob('*/tool.json')}
        print(json.dumps(discover(used)))
