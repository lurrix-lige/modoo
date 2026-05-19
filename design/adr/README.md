# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records for the Modoo project.

## What is an ADR?

An ADR captures a significant architectural decision along with its context and consequences. It is a lightweight document that records "why" a decision was made, not just "what" was decided.

## When to write an ADR

Write an ADR when you:
- Choose a technology stack component (database, framework, library)
- Make a significant architectural pattern decision
- Decide to adopt or reject a particular approach
- Change a previous architectural decision

## ADR Format

Each ADR follows the [Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions):

1. **Title** - Short, descriptive, numbered sequentially
2. **Status** - Proposed / Accepted / Deprecated / Superseded
3. **Context** - The forces at play and the problem being solved
4. **Decision** - The chosen solution
5. **Consequences** - What becomes easier and harder as a result

## Usage

```bash
cp TEMPLATE.md 0001-my-decision-title.md
# Edit the file, then commit
```
