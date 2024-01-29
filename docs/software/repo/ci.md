# ReFlex: github CI

<!-- omit in toc -->
## Table of Contents

1. [Workflows](#workflows)
2. [Pull Request (main)](#pull-request-main)

## Workflows

| File                      | Name                           | Description                                                | PR  | Push | Release | reusable | manual |
| ------------------------- | ------------------------------ | ---------------------------------------------------------- | --- | ---- | ------- | -------- | ------ |
| `build-test-complete.yml` | ReFlex: Build & Test           | Build and test Library and Server, and generate reports    | X   | X    |         |          | X      |
| `cache-cleanup.yml`       | Cleanup PR Caches              | Cleanup caches created for PR when PR is closed            | X   |      |         |          |        |
| `emulator-build.yml`      | ReFlex Emulator: Build         | Build Emulator App                                         | X   | X    |         |          |        |
| `emulator-release.yml`    | ReFlex Emulator: Publish (Win) | Create Emulator Electron App as release                    |     |      | X       |          |        |
| `library-build.yml`       | ReFlex Library: Build          | Build Library (.NET)                                       |     |      |         | X        |        |
| `library-test.yml`        | ReFlex Library: Test           | Build and Test Library (.NET)                              |     |      |         | X        |        |
| `pages-deploy.yml`        | Pages: Deploy                  | Deploy Documentation with test reports restored from Cache |     | X    |         |          | X      |
| `server-build.yml`        | ReFlex Server: Build           | Build Server (Angular)                                     | X   | X    |         |          |        |
| `server-lint.yml`         | ReFlex Server: Lint            | Run Linter for Server (Angular)                            | X   | X    |         |          |        |
| `server-release.yml`      | ReFlex Server: Publish (Win)   | Create Server Electron App as release                      |     |      | X       |          |        |
| `server-test.yml`         | ReFlex Server: Test            | Test Server (Angular)                                      | X   | X    |         |          |        |
| `shared-test.yml`         | ReFlex Shared Types: Build     | Build Shared Types Lib (Typescript)                        | X   | X    |         | X        |        |

__[⬆ back to top](#table-of-contents)__

## Pull Request (main)

Workflows to be run:

* [ReFlex: Build & Test](#reflex-build--test-build-test-completeyml)
* Cleanup PR Caches
* ReFlex Emulator: Build
* ReFlex Library: Build, ReFlex Library: Test (triggered by [ReFlex: Build & Test](#reflex-build--test-build-test-completeyml))
* ReFlex Server: Build
* ReFlex Server: Lint
* ReFlex Server: Test
* ReFlex Shared Types: Build

### ReFlex: Build & Test (build-test-complete.yml)

Composite workflow that:

* Builds and tests ReFlex Library
* Builds and tests ReFlex Server
* Collects Reports for Server ans Library
* Saves these reports in Cache `test-reports`

Prerequisite step for `Pages: Deploy`

```mermaid
%%{ init: { "flowchart": {"htmlLabels": false}}}%%

flowchart TD
    A(["`ReFlex Library: Build *library-build.yml*`"]) 
    -. build-library .-> 
    B(["`ReFlex Library: Test *library-test.yml*`"])

    B(["`ReFlex Library: Test *library-test.yml*`"])
    -. generate_test-report_library .->
    D(["`ReFlex: Build & Test *build-test-complete.yml*`"])

    C(["`ReFlex Server: Test *server-test.yml*`"])
    -. generate_test-report_server .->
    D(["`ReFlex: Build & Test *build-test-complete.yml*`"])

    D(["`ReFlex: Build & Test *build-test-complete.yml*`"])
    -. collect-cache_data .->
    E(["`ReFlex: Build & Test *build-test-complete.yml*`"])
```

### Pages: Deploy (pages-deploy.yml)

* collects test report from cache `test-reports`
* __REMARKS__ Caches for github actions are scoped to the current branch (or `main` branch). this means that cached reports created on a feature branch or PR are not restored. Instead, in this case the last cache created on `main` branch is retrieved. This should not be an issue, as by default, commits / PRs for `pages` should not contain changes to documentation. However, after merging a PR that changed the documentation, the updated documentation is only retrieved from cache when `Pages: Deploy` runs __AFTER__ `ReFlex: Build & Test`. As this order is not enforced, it might be necessary to manually trigger `Pages: Deploy` on `main` afterwards to update pages with the new version of the documentation
* copies readme files from repository to `docs` (using `scripts/copy_docs.sh`)
* builds page with jekyll
* deploy github page artifact

### Cleanup PR Caches

When creating a PR and running checks, the caches created during these workflow runs are only valid when PR is updated. As Caches are scoped to that current PR branch, these caches are not longer useful for other workflow runs. This workflow deletes these cache automatically, to free up space.
More information: [github Documentation](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows#force-deleting-cache-entries)

__[⬆ back to top](#table-of-contents)__
