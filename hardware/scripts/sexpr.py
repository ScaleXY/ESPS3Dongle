"""Minimal KiCad s-expression reader/writer (lists of str tokens)."""
import re

_TOK = re.compile(r'\(|\)|"(?:[^"\\]|\\.)*"|[^\s()"]+')


def parse(text):
    stack, cur = [], []
    for m in _TOK.finditer(text):
        t = m.group(0)
        if t == "(":
            stack.append(cur)
            cur = []
        elif t == ")":
            done = cur
            cur = stack.pop()
            cur.append(done)
        else:
            cur.append(t)
    return cur[0]


def dump(node, ind=0):
    if not isinstance(node, list):
        return node
    if all(not isinstance(c, list) for c in node):
        return "(" + " ".join(node) + ")"
    pad = "\t" * (ind + 1)
    head = [c for c in node if not isinstance(c, list)]
    out = "(" + " ".join(head)
    for c in node:
        if isinstance(c, list):
            out += "\n" + pad + dump(c, ind + 1)
    return out + "\n" + "\t" * ind + ")"


def find(node, key):
    return [c for c in node if isinstance(c, list) and c and c[0] == key]


def first(node, key):
    r = find(node, key)
    return r[0] if r else None
