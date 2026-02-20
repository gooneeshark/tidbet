---
description: How to run terminal commands avoiding cross-drive freezing bugs
---
# Cross-Drive Terminal execution FIX

When the Antigravity assistant is installed on one drive (e.g., `D:`) while the project resides on a different drive (e.g., `E:`), there is a known issue where terminal commands hang indefinitely if executed directly targeting the project folder.

## Root Cause

The terminal Shell Integration attempts to execute PowerShell from the system drive (`C:`), load scripts from the installation drive (`D:`), and run the task in the project drive (`E:`). This cross-drive jump causes PowerShell to freeze.

## Standard Fix for the Assistant

Never specify the project's secondary drive directly in the `Cwd` (Current Working Directory) field when invoking commands.

### The "C-Drive Jump" approach

1. Always set `Cwd` field to `C:\` (the system drive).
2. Manually switch to the target drive and folder within the `CommandLine` argument using a semicolon (`;`).

#### Example: Running an application (E:\git\tidbet)

**BAD APPROACH** (Will hang the terminal indefinitely):

* `Cwd`: `E:\git\tidbet`
* `CommandLine`: `npm start`

**GOOD APPROACH** (Will execute smoothly):

* `Cwd`: `C:\`
* `CommandLine`: `E:; cd \git\tidbet; npm start`

## Alternative

As a general rule, use internal file system APIs (`view_file`, `list_dir`, `write_to_file`, `find_by_name`) for 90% of file manipulations to bypass the shell integration entirely. Reserve `run_command` only for system/build scripts and environment-level packages like npm or git.
