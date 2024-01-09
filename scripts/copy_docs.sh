# bash function to copy and create target directory if not exists
CP() {
    mkdir -p $(dirname "$2") && cp "$1" "$2"
}

CP readme.md docs/software/repo/reflex.md
CP library/README.md docs/software/repo/library.md
CP tools/ReFlex.TrackingServer/readme.md docs/software/apps/server.md
CP tools/logging/README.md docs/software/apps/logging.md
CP tools/emulator/README.md docs/software/apps/emulator.md