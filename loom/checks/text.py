"""Text utilities shared by the gates."""
from __future__ import annotations

import re

DASHES = re.compile("[—–―]")
NUM = re.compile(r"(?<![\w.])(\d[\d,]*(?:\.\d+)?)(?:\s?(%|percent))?")
NUM_WORDS = {"zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
             "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60,
             "seventy": 70, "eighty": 80, "ninety": 90, "hundred": 100, "thousand": 1000, "half": 0.5}


def numbers(s: str) -> list[str]:
    """Digit numbers in a string, normalised ('1,050' -> '1050')."""
    return [m.group(1).replace(",", "") for m in NUM.finditer(s or "")]


def words(s: str) -> list[str]:
    return [w for w in re.split(r"\s+", s or "") if re.search(r"\w", w)]


def norm_words(s: str) -> list[str]:
    return [re.sub(r"[^\w']", "", w.lower()) for w in words(s)]


def overlap_ratio(a: str, b: str) -> float:
    """share of a's words that appear, in order-insensitive bag terms, in b"""
    A, B = norm_words(a), norm_words(b)
    if not A:
        return 0.0
    bag = {}
    for w in B:
        bag[w] = bag.get(w, 0) + 1
    hit = 0
    for w in A:
        if bag.get(w, 0) > 0:
            hit += 1; bag[w] -= 1
    return hit / len(A)
