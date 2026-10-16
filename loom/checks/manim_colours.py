"""Fixed-colour check for Manim scenes (D-40).

A Manim scene must take every colour from the look (`C.<token>`), never hard-code one. A fixed colour
silently ignores the style and the brand, and it also escapes the read record the clip store relies on
(D-37). This check parses the scene (Python AST, no Manim needed, deterministic) and refuses:

- a hex string anywhere in code ("#FF0000", "#f00", "#FF000080"; docstrings are skipped);
- a Manim colour constant (WHITE, BLACK, BLUE, BLUE_E, PURE_RED, GRAY_BROWN, DARK_BLUE, ...);
- a colour NAME string given to a colour argument (color="red", fill_color="white", colors=["blue"]);
- a colour built from constants (ManimColor("#.."), ManimColor.from_rgb((1, 0, 0)), rgb_to_color([..])).

Opt-out, for a line where a literal colour IS the point (say, a scene about hex codes), with a reason:
    dot.set_color("#FF0000")  # loom: literal-colour the lesson is about this exact hex value
An opt-out without a reason is itself an error.
"""
from __future__ import annotations

import ast
import re

HEX = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$")
_HUES = "RED|BLUE|GREEN|YELLOW|GOLD|TEAL|MAROON|PURPLE|PINK|ORANGE|GRAY|GREY"
MANIM_CONST = re.compile(
    rf"^(?:WHITE|BLACK|(?:LIGHTER|LIGHT|DARK|DARKER)_(?:GRAY|GREY|BROWN|PINK|BLUE)|GRAY_BROWN|GREY_BROWN|LIGHT_BROWN|DARK_BROWN|"
    rf"PURE_(?:RED|GREEN|BLUE|YELLOW|CYAN|MAGENTA)|(?:{_HUES})(?:_[A-E])?|LOGO_(?:WHITE|GREEN|BLUE|RED|BLACK))$")
NAMED = {"white", "black", "red", "green", "blue", "yellow", "gold", "teal", "maroon", "purple", "pink", "orange", "gray", "grey",
         "brown", "cyan", "magenta", "navy", "lime", "olive", "silver", "violet", "indigo", "crimson", "tomato", "coral", "salmon"}
COLOUR_ARGS = re.compile(r"^(?:color|colors|fill_color|stroke_color|background_color|background_stroke_color|sheen_color|"
                         r"[a-z_]*_color|[a-z_]*_colors)$")
BUILDERS = {"ManimColor", "rgb_to_color", "rgba_to_color", "hex_to_color", "color_to_rgb", "rgb_to_hex"}
OPT_OUT = re.compile(r"#\s*loom:\s*literal-colou?r\b(.*)$")
# Skia (D-53): skia.ColorWHITE-style constants, colours built from literals, and 0xAARRGGBB integers
SKIA_CONST = re.compile(r"^Color(?:WHITE|BLACK|RED|GREEN|BLUE|YELLOW|CYAN|MAGENTA|GRAY|LTGRAY|DKGRAY)$")
SKIA_BUILDERS = {"Color", "ColorSetRGB", "ColorSetARGB", "Color4f"}
HEX_INT = re.compile(r"\b0[xX][0-9a-fA-F]{6,8}\b")


def _docstring_nodes(tree) -> set:
    ids = set()
    for n in ast.walk(tree):
        if isinstance(n, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)) and n.body:
            first = n.body[0]
            if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant) and isinstance(first.value.value, str):
                ids.add(id(first.value))
    return ids


def _is_const(node) -> bool:
    if isinstance(node, ast.Constant):
        return True
    if isinstance(node, (ast.Tuple, ast.List)):
        return all(_is_const(e) for e in node.elts)
    if isinstance(node, ast.UnaryOp):
        return _is_const(node.operand)
    return False


def _strings_in(node):
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        yield node
    elif isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        for e in node.elts:
            yield from _strings_in(e)


def check_source(src: str, name: str = "scene.py", dialect: str = "manim") -> list[str]:
    try:
        tree = ast.parse(src)
    except SyntaxError as e:
        return [f"{name}: does not parse ({e.msg}, line {e.lineno})"]
    lines = src.splitlines()
    docs = _docstring_nodes(tree)
    found: list[tuple[int, str]] = []

    if dialect == "skia":
        for i, line in enumerate(lines, 1):
            code = line.split("#", 1)[0]
            for m in HEX_INT.finditer(code):
                found.append((i, f"colour integer {m.group(0)}"))
    for n in ast.walk(tree):
        if dialect == "skia":
            if isinstance(n, ast.Attribute) and SKIA_CONST.match(n.attr):
                found.append((n.lineno, f"Skia colour constant {n.attr}"))
                continue
            if isinstance(n, ast.Call):
                f = n.func
                fname = f.attr if isinstance(f, ast.Attribute) else (f.id if isinstance(f, ast.Name) else "")
                if fname in SKIA_BUILDERS and n.args and all(_is_const(a) for a in n.args):
                    found.append((n.lineno, f"colour built from constants: {fname}(...)"))
                    continue
        if isinstance(n, ast.Constant) and isinstance(n.value, str) and id(n) not in docs and HEX.match(n.value.strip()):
            found.append((n.lineno, f"hex colour {n.value!r}"))
        elif isinstance(n, ast.Name) and MANIM_CONST.match(n.id) and isinstance(n.ctx, ast.Load):
            found.append((n.lineno, f"Manim colour constant {n.id}"))
        elif isinstance(n, ast.Attribute) and MANIM_CONST.match(n.attr) and isinstance(n.value, ast.Name) and n.value.id in ("manim", "M"):
            found.append((n.lineno, f"Manim colour constant {n.value.id}.{n.attr}"))
        elif isinstance(n, ast.keyword) and n.arg and COLOUR_ARGS.match(n.arg):
            for sn in _strings_in(n.value):
                if sn.value.strip().lower() in NAMED:
                    found.append((sn.lineno, f"colour name {sn.value!r} for {n.arg}="))
        elif isinstance(n, ast.Call):
            f = n.func
            fname = f.id if isinstance(f, ast.Name) else (f.attr if isinstance(f, ast.Attribute) else "")
            owner = f.value.id if isinstance(f, ast.Attribute) and isinstance(f.value, ast.Name) else ""
            if (fname in BUILDERS or owner == "ManimColor") and n.args and all(_is_const(a) for a in n.args):
                found.append((n.lineno, f"colour built from constants: {owner + '.' if owner else ''}{fname}(...)"))

    errs, seen = [], set()
    for ln, what in sorted(found):
        if (ln, what) in seen:
            continue
        seen.add((ln, what))
        line = lines[ln - 1] if 0 < ln <= len(lines) else ""
        m = OPT_OUT.search(line)
        if m:
            if len(m.group(1).strip()) < 8:
                errs.append(f"{name}:{ln}: `# loom: literal-colour` needs a reason (why this colour must not follow the look)")
            continue
        errs.append(f"{name}:{ln}: {what}; take colours from the look (C.accent, C.ink, C.muted ...) so style and brand apply")
    return errs


def check_file(path, dialect: str = "manim") -> list[str]:
    from pathlib import Path
    p = Path(path)
    return check_source(p.read_text(encoding="utf-8"), p.name, dialect)
