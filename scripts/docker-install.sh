#!/bin/sh
# The Dockerfile's dependency install, with the token for the private
# @open-waters-digital packages on GitHub Packages.
#
# A script rather than inline in the RUN step because BuildKit prints a RUN
# step's command with its build arguments expanded: written inline, the token
# appeared in plain text in the build log, which on Railway anyone with access
# to the project can read. Here the step reads `sh docker-install.sh`, and the
# token only exists inside this process.
#
# pnpm 11.5.3+ will not expand a token from the committed .npmrc, so a
# user-level one is written, used and removed in this one step: it never lands
# in a layer. Arguments are passed on to pnpm install.
printf '//npm.pkg.github.com/:_authToken=%s\n' "${NODE_AUTH_TOKEN:-}" > "$HOME/.npmrc"
pnpm install --frozen-lockfile "$@"
status=$?
rm -f "$HOME/.npmrc"
exit $status
