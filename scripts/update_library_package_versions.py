#!/usr/bin/env python3
"""Synchronize existing README package rows with ReFlex.Library.sln projects.

Uses Python's standard library; no .NET SDK or package restore is required.
Packages outside the solution are left unchanged. Versions must be literal
PackageReference attributes or child elements, as used by this solution.
"""

from pathlib import Path
import re
import xml.etree.ElementTree as ET


PACKAGE_ROW = re.compile(r"^(\|\s*__([^|]+?)__\s*\|)([^|]+)(\|.*)$", re.MULTILINE)


def update_readme(root: Path) -> bool:
    solution = root / "library/src/ReFlex.Library.sln"
    readme = root / "library/README.md"
    original = readme.read_bytes().decode("utf-8")
    start = original.index("### nuget Packages")
    end = original.index("## Project Structure", start)
    section = original[start:end]
    documented = {match[2].casefold() for match in PACKAGE_ROW.finditer(section)}
    packages: dict[str, set[str]] = {}
    projects = re.findall(r'^Project\([^\n]+ = "[^"\n]+", "([^"\n]+\.csproj)"',
                          solution.read_text(encoding="utf-8-sig"), re.MULTILINE)
    if not projects:
        raise ValueError(f"No C# projects found in {solution}")
    for project in projects:
        path = solution.parent / project.replace("\\", "/")
        for reference in ET.parse(path).getroot().iter():
            if reference.tag.rsplit("}", 1)[-1] != "PackageReference":
                continue
            name = reference.get("Include", "").casefold()
            if name not in documented:
                continue
            version = reference.get("Version") or next(
                (child.text for child in reference
                 if child.tag.rsplit("}", 1)[-1] == "Version"), None
            )
            if not version or not version.strip() or "$" in version:
                raise ValueError(f"Expected a literal version for {name} in {path}")
            packages.setdefault(name, set()).add(version.strip())

    def replace(match: re.Match) -> str:
        versions = packages.get(match[2].casefold())
        if not versions:
            return match[0]
        version = ", ".join(sorted(versions))
        # Preserve the existing column width where possible.
        cell = " " + version + " " * max(1, len(match[3]) - len(version) - 1)
        return match[1] + cell + match[4]

    updated = original[:start] + PACKAGE_ROW.sub(replace, section) + original[end:]
    if updated == original:
        return False
    readme.write_bytes(updated.encode("utf-8"))
    return True


if __name__ == "__main__":
    changed = update_readme(Path(__file__).resolve().parents[1])
    print("Updated library/README.md" if changed else "Package versions are up to date.")
