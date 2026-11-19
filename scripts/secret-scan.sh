#!/usr/bin/env bash
set -euo pipefail

# The expected digests come from the official versioned GitHub release.
version=8.30.1
case "$(uname -sm)" in
  'Linux x86_64')
    target=linux_x64
    digest=551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb ;;
  'Darwin arm64')
    target=darwin_arm64
    digest=b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5 ;;
  *) echo 'Run the release scan on Linux x64 or Apple Silicon.' >&2; exit 2 ;;
esac

temporary=$(mktemp -d)
trap 'rm -rf "$temporary"' EXIT
archive="$temporary/scanner.tar.gz"
url="https://github.com/gitleaks/gitleaks/releases/download/v$version/gitleaks_${version}_${target}.tar.gz"
curl --fail --silent --show-error --location --proto '=https' --retry 2 "$url" --output "$archive"
computed=$(shasum -a 256 "$archive" | cut -d' ' -f1)
if [[ "$computed" != "$digest" ]]; then
  echo 'Scanner checksum failed.' >&2
  exit 1
fi
tar -xzf "$archive" -C "$temporary" gitleaks
"$temporary/gitleaks" dir --no-banner --redact=100 .
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  "$temporary/gitleaks" git --no-banner --redact=100 --log-opts="${1:---all}" .
fi
