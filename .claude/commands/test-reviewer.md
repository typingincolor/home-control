# Test Reviewer

Review all tests in this codebase to ensure they are valid, useful, and necessary.

## Your Task

Analyze the test suite and provide a comprehensive review. For each test file and test case, evaluate:

### 1. Validity

- Does the test actually test what it claims to test?
- Are assertions correct and meaningful?
- Does the test pass for the right reasons (not false positives)?
- Are mocks/stubs configured correctly?
- Does the test handle edge cases appropriately?

### 2. Usefulness

- Does the test provide value by catching real bugs?
- Is the test testing behavior that matters to users or the system?
- Does the test cover meaningful scenarios vs trivial implementation details?
- Would a failure in this test indicate a real problem?

### 3. Necessity

- Is this test redundant with other tests?
- Is the test testing third-party library behavior instead of our code?
- Is it testing auto-generated code or framework boilerplate?
- Is it testing private implementation details that might change?
- Is there dead code being tested that should be removed?

## Process

1. **Discover tests**: Find all test files in the codebase (look for common patterns like `*.test.*`, `*.spec.*`, `__tests__/`, `test/`, `tests/`, `*_test.*`)

2. **Analyze each test file**: Read and understand what each test is verifying

3. **Cross-reference with source**: Check that tested code still exists and the tests align with current implementation

4. **Generate report**: Provide a structured report with:
   - Summary statistics (total tests, issues found by category)
   - List of problematic tests with specific issues
   - Recommended actions (remove, refactor, or keep with modifications)

## Output Format

Provide your findings in this structure:

```
## Summary
- Total test files reviewed: X
- Total test cases reviewed: X
- Tests to remove: X
- Tests to refactor: X
- Tests that are good: X

## Issues Found

### Tests to Remove
[List tests that should be deleted with reasoning]

### Tests to Refactor
[List tests that need improvement with specific suggestions]

### Tests Missing Coverage
[Note any important code paths that lack test coverage]

## Recommendations
[Overall suggestions for improving the test suite]
```

## Guidelines

- Be specific about which tests have issues and why
- Provide actionable recommendations
- Consider test maintainability and clarity
- Flag flaky tests or tests with race conditions
- Note any tests that are too tightly coupled to implementation
- Identify tests that would benefit from parameterization
- Look for opportunities to consolidate similar tests
