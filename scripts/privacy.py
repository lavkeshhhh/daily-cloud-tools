"""Check the publication inventory, text, and Git identities. Findings are redacted."""
import argparse
import ipaddress
import os
from pathlib import Path
import re
import stat
import subprocess
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
HANDLE = 'lavkeshhhh'
NOREPLY = 'users.noreply.github.com'
BOT = 'github-actions[bot]'
IDENTITIES = {
    '43887026+' + HANDLE + '@' + NOREPLY: {HANDLE, 'Lavkesh'},
    '41898282+' + BOT + '@' + NOREPLY: {BOT},
    'noreply@github.com': {'GitHub', 'web-flow'},
}
FILES = {
    '.gitignore', '.github/workflows/daily.yml', 'README.md', 'PROJECT.md',
    'site/index.html', 'site/style.css', 'recipes/calculators.cjs',
    'site/shared/calculator.js', 'site/shared/oci.js',
    'test/plan.test.cjs', 'test/daily.test.cjs', 'test/privacy_test.py',
    'scripts/catalog.cjs', 'scripts/models.cjs', 'scripts/publish.cjs',
    'scripts/oci_reference.py', 'scripts/verify.cjs', 'scripts/privacy.py',
    'scripts/secret-scan.sh',
}
APP_SLUG = r'[a-z0-9]+(?:-[a-z0-9]+)*'
DAILY_FILES = {'index.html', 'PROJECT.md', 'tool.json', 'cases.json', 'model.js'}
PLAN_FILES = {'index.html', 'PROJECT.md', 'tool.json', 'core.js', 'ui.js', 'examples.js'}
LIMIT = 256 * 1024
RULES = {
    'cloud resource identifier': r'\bocid1\.[a-z0-9_-]+\.',
    'private key': r'-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----',
    'user directory': r'(?i)(?:/(?:users|home)/[\w.-]+|[a-z]:\\users\\[\w.-]+)',
    'private domain': r'(?i)\b[a-z0-9-]+\.(?:corp|internal|intranet|lan|local|oraclecorp\.com)\b',
    'connection string': r'(?i)(?:jdbc[:]oracle[:]|BEGIN[ ]SSH2|\(HOST\s*=\s*[^)]+\))',
    'credential assignment': r'''(?i)\b(?:password|passphrase|api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_+/.-]{5,}''',
}
PATTERNS = {name: re.compile(rule) for name, rule in RULES.items()}
EMAIL = re.compile(r"[A-Za-z0-9_%+.\[\]-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
IPV4 = re.compile(r'(?<![\w.])(?:\d{1,3}\.){3}\d{1,3}(?![\w.])')
IPV6 = re.compile(r'(?<![\w:])(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}(?![\w:])')
URL = re.compile(r"""https?://[^\s<>"'`\)]+""", re.I)
PREFIXES = {
    'github.com': ('/lavkeshhhh/daily-cloud-tools', '/gitleaks/gitleaks'),
    'lavkeshhhh.github.io': ('/daily-cloud-tools',),
    'docs.oracle.com': ('/en/database', '/en-us/iaas/tools/oci-cli'),
    'docs.github.com': ('/en/actions', '/en/pages'),
}


def public_path(name):
    if name in FILES or re.fullmatch(r'queue/oci/\d{2}-oci-' + APP_SLUG + r'\.json', name):
        return True
    parts = name.split('/')
    if len(parts) != 4 or parts[:2] != ['site', 'apps'] or not re.fullmatch(APP_SLUG, parts[2]):
        return False
    return parts[3] in (PLAN_FILES if parts[2] == 'oracle-plan-compare' else DAILY_FILES)


def permitted_url(raw):
    try:
        url = urlsplit(raw.rstrip('.,'))
        if url.username or url.password or url.query or url.fragment and '=' in url.fragment:
            return False
        if url.hostname == 'localhost':
            return url.scheme == 'http' and url.port == 8000 and url.path in ('', '/')
        if url.scheme != 'https' or url.port is not None:
            return False
        return any(url.path == prefix or url.path.startswith(prefix + '/')
                   for prefix in PREFIXES.get(url.hostname, ()))
    except ValueError:
        return False


def reasons(content):
    if len(content) > LIMIT:
        return {'oversized file'}
    try:
        text = content.decode('utf-8')
    except UnicodeError:
        return {'binary file'}
    hits = {name for name, pattern in PATTERNS.items() if pattern.search(text)}
    if any(ord(char) < 32 and char not in '\n\r\t' for char in text):
        hits.add('binary control bytes')
    if any(match.group() not in IDENTITIES for match in EMAIL.finditer(text)):
        hits.add('personal email')
    for pattern in (IPV4, IPV6):
        for match in pattern.finditer(text):
            value = match.group()
            if value == '::':
                continue
            try:
                ipaddress.ip_address(value)
            except ValueError:
                continue
            hits.add('literal IP address')
            break
    if any(not permitted_url(match.group()) for match in URL.finditer(text)):
        hits.add('unapproved URL')
    return hits


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def check_files():
    names = {os.fsdecode(item) for item in git('ls-files', '--cached', '--others',
                                               '--exclude-standard', '-z').split(b'\0') if item}
    # Pages receives the actual site directory, including ignored and hidden files.
    for item in (ROOT / 'site').rglob('*'):
        if item.is_symlink() or not item.is_dir():
            names.add(item.relative_to(ROOT).as_posix())
    for name in sorted(names):
        if not public_path(name):
            raise ValueError('Unexpected file (name withheld).')
        path = ROOT / name
        if any(parent.is_symlink() for parent in path.parents if parent.is_relative_to(ROOT)):
            raise ValueError('Linked directory.')
        info = path.lstat()
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_size > LIMIT:
            raise ValueError('File type, link or size restriction.')
        hits = reasons(path.read_bytes())
        if hits:
            raise ValueError(name + ': ' + ', '.join(sorted(hits)))
    return len(names)


def check_history(ref):
    seen = set()
    revisions = git('rev-list', ref).decode().splitlines()
    for rev in revisions:
        author, author_mail, committer, committer_mail, message = git(
            'show', '-s', '--format=%an%x00%ae%x00%cn%x00%ce%x00%B', rev
        ).decode().split('\0', 4)
        if author not in IDENTITIES.get(author_mail, ()) or committer not in IDENTITIES.get(committer_mail, ()):
            raise ValueError('Unapproved commit attribution.')
        if reasons(message.encode()):
            raise ValueError('Private pattern in a commit message.')
        for entry in git('ls-tree', '-rz', rev).split(b'\0'):
            if not entry:
                continue
            header, raw_name = entry.split(b'\t', 1)
            mode, kind, oid = header.decode().split()
            name = os.fsdecode(raw_name)
            if kind != 'blob' or mode not in ('100644', '100755') or not public_path(name):
                raise ValueError('Unexpected historical file or mode (name withheld).')
            if oid not in seen:
                if int(git('cat-file', '-s', oid)) > LIMIT or reasons(git('cat-file', 'blob', oid)):
                    raise ValueError('Historical file failed the content policy: ' + name)
                seen.add(oid)
    return len(revisions)


def check_daily_scope(ref, slug):
    if not re.fullmatch(APP_SLUG, slug):
        raise ValueError('Unexpected app slug.')
    names = set(os.fsdecode(item) for item in git('diff', '--cached', '--name-only', '-z', ref).split(b'\0') if item)
    expected = {'site/apps/' + slug + '/' + filename for filename in DAILY_FILES} | {'site/index.html'}
    if names and names != expected:
        raise ValueError('Daily commit differs from the expected app and catalog.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--history', metavar='REF')
    parser.add_argument('--daily', nargs=2, metavar=('REF', 'SLUG'))
    args = parser.parse_args()
    try:
        count = check_files()
        print(f'Publication inventory and text checks passed for {count} files.')
        if args.history:
            print(f'Checked files, messages and attribution in {check_history(args.history)} commits.')
        if args.daily:
            check_daily_scope(*args.daily)
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        print('Publication stopped: ' + (str(exc) if isinstance(exc, ValueError) else 'File or Git access failed.'), file=sys.stderr)
        sys.exit(1)
