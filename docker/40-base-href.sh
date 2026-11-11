#!/bin/sh
# Sets the <base href> of index.html from the BASE_HREF environment variable,
# so one image can be served at the domain root or under a sub-path behind a
# reverse proxy (e.g. BASE_HREF=/v6/ui/).
#
# The official nginx image runs every script in /docker-entrypoint.d/ before
# nginx starts. The base must be an absolute path: a relative one such as "./"
# resolves against the current page, so on a deep link like
# /v6/ui/administration/groups every bundle, config and translation file is
# requested below /administration/ and the app does not start.
set -eu

BASE_HREF="${BASE_HREF:-/}"
INDEX=/usr/share/nginx/html/index.html

case "$BASE_HREF" in
  / | /*/) ;;
  *)
    echo "$0: BASE_HREF must be an absolute path that starts and ends with '/', got '$BASE_HREF'" >&2
    exit 1
    ;;
esac

# '|' is the sed delimiter, so it must not appear in the value either.
case "$BASE_HREF" in
  *'|'* | *'"'* | *'&'* | *'\'*)
    echo "$0: BASE_HREF contains an unsupported character: '$BASE_HREF'" >&2
    exit 1
    ;;
esac

sed -i "s|<base href=\"[^\"]*\"|<base href=\"$BASE_HREF\"|" "$INDEX"
echo "$0: <base href> set to $BASE_HREF"
