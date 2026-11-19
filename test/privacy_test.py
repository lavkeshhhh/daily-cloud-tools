"""Exercise privacy failures using synthetic data constructed inside temporary tests."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

source = Path(__file__).resolve().parents[1] / 'scripts' / 'privacy.py'
spec = importlib.util.spec_from_file_location('publication_privacy', source)
privacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)


class PrivacyTests(unittest.TestCase):
    def test_generated_indicators_are_rejected(self):
        synthetic = {
            'personal email': 'simulated.person' + chr(64) + 'example.invalid',
            'cloud resource identifier': 'ocid1' + '.tenancy.' + 'invalid',
            'private key': '-----BEGIN ' + 'PRIVATE KEY-----',
            'user directory': '/' + 'Users' + '/synthetic-account/report',
            'private domain': 'example' + '.internal',
            'literal IP address': '.'.join(('192', '0', '2', '7')),
            'connection string': 'jdbc' + ':oracle:' + 'thin',
            'unapproved URL': 'https' + '://unapproved.example.invalid/resource',
            'credential assignment': 'api' + '_key=' + repr('imaginary-value'),
        }
        for reason, content in synthetic.items():
            with self.subTest(reason=reason):
                self.assertIn(reason, privacy.reasons(content.encode()))
        self.assertIn('literal IP address', privacy.reasons((':'.join(['2001', 'db8', '', '1'])).encode()))
        self.assertFalse(privacy.reasons(b'Examples use DEMO_ORDERS and synthetic inputs.'))

    def test_only_recognized_public_destinations_and_paths(self):
        base = 'https' + '://'
        self.assertTrue(privacy.permitted_url(base + 'docs.oracle.com/en/database/'))
        for text in ['docs.oracle.com.untrusted.invalid/en/database/', 'github.com/other/project',
                     'docs.oracle.com/en/database/?value=synthetic', 'someone' + '@' + 'docs.oracle.com/en/database/']:
            self.assertFalse(privacy.permitted_url(base + text))
        for name in ['.env', 'site/key.pem', 'site/apps/demo/data.csv', 'notes/PROJECT.md', 'site/.DS_Store']:
            self.assertFalse(privacy.public_path(name))

    def test_pages_rejects_ignored_files_and_links(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            (root / 'site').mkdir()
            (root / '.gitignore').write_text('.DS_Store\n')
            with patch.object(privacy, 'ROOT', root):
                self.assertEqual(privacy.check_files(), 1)
                hidden = root / 'site' / '.DS_Store'
                hidden.write_text('synthetic')
                with self.assertRaises(ValueError):
                    privacy.check_files()
                hidden.unlink()
                (root / 'site' / 'index.html').symlink_to(root / '.gitignore')
                with self.assertRaises(ValueError):
                    privacy.check_files()


if __name__ == '__main__':
    unittest.main()
