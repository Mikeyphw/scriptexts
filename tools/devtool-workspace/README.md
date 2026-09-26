# Devtool workspace target

This tiny directory gives the repository-wide orchestration target a narrow ownership root.
It prevents `devtool --affected` from treating every repository file as owned by the workspace
orchestrator while still allowing normal wrapper commands to use `workspace` as the default target.
