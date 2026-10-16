"""Loom - a pedagogy-first, code-rendered L&D video engine.

Pipeline (every artifact is a JSON file in the project folder):
    brief -> knowledge (topic mode) -> pedagogy -> persona -> script -> allocate -> storyboard
    -> narrate -> scenes -> compose -> check -> review -> render

Model stages run in AGENT mode (Claude Code / Cowork follows a task file) or API mode
(Anthropic Messages API). Everything else is deterministic code.
"""
__version__ = "0.1.0"
