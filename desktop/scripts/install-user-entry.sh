#!/bin/bash
# Same user install as packaging/install.sh.
set -euo pipefail
root=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
exec "$root/packaging/install.sh" "$@"
