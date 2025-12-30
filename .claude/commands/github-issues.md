# GitHub Issues Management

Manage GitHub issues directly from the command line. You can create, update, list, and close issues.

## Commands

### Create a new issue

```
/github-issues create <title> [--body "description"] [--labels label1,label2] [--assignee username]
```

### List issues

```
/github-issues list [--state open|closed|all] [--labels label1,label2] [--limit N]
```

### View an issue

```
/github-issues view <issue_number>
```

### Update an issue

```
/github-issues update <issue_number> [--title "new title"] [--body "new body"] [--labels label1,label2] [--assignee username]
```

### Close an issue (mark as fixed)

```
/github-issues close <issue_number> [--comment "Closing message"]
```

### Reopen an issue

```
/github-issues reopen <issue_number>
```

### Add a comment

```
/github-issues comment <issue_number> "Your comment here"
```

## Examples

```bash
# Create a bug report
/github-issues create "Login button not working" --body "Users can't log in on mobile" --labels bug,high-priority

# List all open bugs
/github-issues list --state open --labels bug

# Update issue #42 with new labels
/github-issues update 42 --labels bug,in-progress --assignee octocat

# Close issue #42 as fixed
/github-issues close 42 --comment "Fixed in commit abc123"

# View details of issue #42
/github-issues view 42
```

## Instructions

When the user runs any of these commands:

1. **Detect the repository**: Use `git remote get-url origin` to find the current repo
2. **Use the GitHub CLI (`gh`)**: All operations should use the `gh` CLI tool
3. **Provide clear feedback**: Show success/failure messages with issue URLs

### Implementation Commands

**Create issue:**

```bash
gh issue create --title "TITLE" --body "BODY" --label "label1,label2" --assignee "username"
```

**List issues:**

```bash
gh issue list --state STATE --label "label" --limit N
```

**View issue:**

```bash
gh issue view ISSUE_NUMBER
```

**Update issue:**

```bash
gh issue edit ISSUE_NUMBER --title "TITLE" --body "BODY" --add-label "label" --add-assignee "username"
```

**Close issue:**

```bash
gh issue close ISSUE_NUMBER --comment "MESSAGE"
```

**Reopen issue:**

```bash
gh issue reopen ISSUE_NUMBER
```

**Add comment:**

```bash
gh issue comment ISSUE_NUMBER --body "COMMENT"
```

## Prerequisites

- GitHub CLI (`gh`) must be installed and authenticated
- Must be in a git repository with a GitHub remote

## Tips

- Use `--web` flag with any command to open in browser
- Labels are comma-separated without spaces
- Body text can use markdown formatting
