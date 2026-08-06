"""
Smart 3-Tier Model Routing Engine
=================================
Routes student queries to the minimal-cost LLM tier that can handle them.

Tier 1 (Lightweight):  simple factual queries, definitions, grammar, short answers
Tier 2 (Balanced):     standard homework, essays, step-by-step explanations
Tier 3 (Advanced):     complex math/physics proofs, deep PDF analysis, logic puzzles
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Tier configuration
# ---------------------------------------------------------------------------

# Heuristic keyword weights per tier (higher = more likely)
TIER3_KEYWORDS = [
    # Advanced math / proofs
    "proof", "prove", "theorem", "lemma", "induction", "derivation",
    "derive", "prove that", "formal proof", "epsilon", "delta",
    "limit definition", "contradiction", "irrational", "sqrt",
    "square root", "rational", "prime number", "number theory",
    "group theory", "ring theory", "field theory",
    # Advanced physics
    "lagrangian", "hamiltonian", "schrodinger", "relativity", "tensor",
    "curl", "divergence", "stokes", "maxwell equations", "quantum mechanics",
    # Complex / multi-step
    "multi-step", "complex analysis", "topology", "abstract algebra",
    "optimization problem", "dynamic programming",
    "olympiad", "putnam", "imo", "challenging", "hard problem",
    # Persian equivalents
    "اثبات", "برهان", "قضیه", "لم", "استقرا", "مشتق‌گیری", "انتگرال‌گیری",
    "معادلات ماکسول", "مکانیک کوانتومی", "نسبیت", "الگوریتم",
    "المپیاد", "مسئله سخت", "اثبات کن", "ثابت کن",
    # PDF / document analysis
    "summarize this pdf", "analyze this document", "parse this file",
    "خلاصه pdf", "تحلیل سند", "خلاصه کن این فایل",
    # High-difficulty exam problems
    "final exam", "hard exam", "challenging problem",
    "آزمون نهایی", "سوال سخت", "کنکور", "سوال المپیادی",
]

TIER2_KEYWORDS = [
    # Standard homework / explanations
    "explain", "explanation", "how does", "how do", "why is", "why does",
    "step by step", "walk me through", "help me with", "solve",
    "homework", "assignment", "essay", "write an essay", "explain concept",
    # Intermediate math
    "equation", "solve for", "quadratic", "trigonometry", "calculus",
    "integration", "differentiation", "derivative", "limit", "matrix",
    "linear algebra", "probability", "statistics", "function",
    # Persian equivalents
    "توضیح بده", "توضیح", "چرا", "چطور", "چگونه", "مرحله به مرحله",
    "کمک کن", "حل کن", "حل مسئله", "تکلیف", "تمرین", "انشا", "مقاله",
    "معادله", "مشتق", "انتگرال", "حد", "ماتریس", "احتمال", "آمار",
    "تابع", "مثلثات", "حسابان", "مفهوم را توضیح بده",
]

TIER1_KEYWORDS = [
    # Simple factual / definitions
    "what is", "what are", "define", "definition", "meaning",
    "grammar", "spelling", "translate", "synonym", "antonym", "word",
    "short answer", "what does", "who is", "when", "where",
    # Simple math facts
    "what is 2+2", "multiplication table", "times table",
    # Persian equivalents
    "یعنی چی", "معنی", "تعریف", "قواعد", "ترجمه", "مترادف", "متضاد",
    "کوتاه", "راهنمایی", "املا", "گرامر",
]

# Regex patterns for structural detection
LATEX_PATTERNS = [
    r"\\int", r"\\sum", r"\\lim", r"\\frac", r"\\sqrt", r"\\partial",
    r"\\nabla", r"\\prod", r"\\oint", r"\\iiint", r"\\iiint", r"\\iint",
    r"\\begin\{align", r"\\begin\{equation", r"\\lim_{", r"\\infty",
    r"\bdx\b", r"\bdy\b", r"\bdt\b",
]

MULTI_STEP_PATTERNS = [
    # "then", "after that", "next step"
    r"\b(then|next|after that|subsequently|furthermore|however|therefore)\b",
    # numbered steps
    r"\b(step\s*\d+|first|second|third)\b",
    # Persian multi-step markers
    r"\b(سپس|بعد|مرحله|اول|دوم|سوم)\b",
]

COMPLEX_TOPIC_PATTERNS = [
    r"(lagrangian|hamiltonian|schrodinger|wavefunction|tensor)",
    r"(fourier|laplace transform|complex analysis|analytic continuation)",
    r"(topology|manifold|homotopy|category theory)",
    r"(proof|theorem|lemma|corollary|axiom)",
]


@dataclass
class QueryAnalysis:
    """Result of analyzing an incoming query."""
    tier: int = 2  # default to Tier 2 (Balanced)
    score_tier1: int = 0
    score_tier2: int = 0
    score_tier3: int = 0
    confidence: float = 0.5
    reasons: list[str] = field(default_factory=list)
    has_latex: bool = False
    has_attachment: bool = False
    attachment_type: Optional[str] = None
    text_length: int = 0

    @property
    def label(self) -> str:
        return {1: "Tier 1 (Fast)", 2: "Tier 2 (Balanced)", 3: "Tier 3 (Advanced)"}[self.tier]


class QueryClassifier:
    """Rule-based heuristic classifier that inspects prompt and routes to tier."""

    def classify(
        self,
        text: str,
        attachments: Optional[list[dict]] = None,
        max_tier_override: Optional[int] = None,
    ) -> QueryAnalysis:
        text = (text or "").strip()
        lower = text.lower()
        analysis = QueryAnalysis(text_length=len(text))

        # ---- Attachment-based routing ----
        if attachments:
            analysis.has_attachment = True
            for att in attachments:
                att_type = (att.get("type") or "").lower()
                analysis.attachment_type = att_type
                if att_type == "pdf":
                    analysis.reasons.append("PDF attachment → Tier 3 for document analysis")
                    analysis.score_tier3 += 6
                elif att_type == "image":
                    analysis.reasons.append("Image attachment (OCR/vision) → Tier 2+")
                    analysis.score_tier2 += 3

        # ---- LaTeX complexity ----
        for pattern in LATEX_PATTERNS:
            if re.search(pattern, text):
                analysis.has_latex = True
                analysis.score_tier3 += 2
                analysis.reasons.append(f"Complex LaTeX detected: {pattern}")

        # ---- Keyword scoring ----
        for kw in TIER3_KEYWORDS:
            if kw in lower:
                # "prove"/"proof" are very strong signals
                weight = 4 if kw in ("prove", "proof", "prove that", "formal proof") else 3
                analysis.score_tier3 += weight
                analysis.reasons.append(f"Tier-3 keyword: '{kw}'")

        for kw in TIER2_KEYWORDS:
            if kw in lower:
                analysis.score_tier2 += 2
                analysis.reasons.append(f"Tier-2 keyword: '{kw}'")

        for kw in TIER1_KEYWORDS:
            if kw in lower:
                analysis.score_tier1 += 1
                analysis.reasons.append(f"Tier-1 keyword: '{kw}'")

        # ---- Multi-step detection ----
        multi_step_hits = sum(1 for p in MULTI_STEP_PATTERNS if re.search(p, lower))
        if multi_step_hits >= 2 or (multi_step_hits >= 1 and analysis.text_length > 300):
            analysis.score_tier3 += 3
            analysis.reasons.append("Multi-step reasoning pattern detected")

        # ---- Complex topic detection ----
        for p in COMPLEX_TOPIC_PATTERNS:
            if re.search(p, lower):
                analysis.score_tier3 += 4
                analysis.reasons.append(f"Complex topic: {p}")

        # ---- Long queries / deep analysis ----
        if analysis.text_length > 800:
            analysis.score_tier2 += 2
            analysis.reasons.append("Long query (800+ chars)")
        if analysis.text_length > 2000:
            analysis.score_tier3 += 2
            analysis.reasons.append("Very long query (2000+ chars)")

        # ---- Short factual questions ----
        if analysis.text_length < 60 and analysis.score_tier1 >= 1:
            analysis.score_tier1 += 2
            analysis.reasons.append("Short factual question")

        # ---- Final tier decision ----
        # First check if any tier-3 hard signals dominate
        if analysis.score_tier3 >= 8:
            analysis.tier = 3
        elif analysis.score_tier3 >= 4:
            # Check if tier-2 signals are stronger
            if analysis.score_tier2 - analysis.score_tier3 > 4:
                analysis.tier = 2
            else:
                analysis.tier = 3
        elif analysis.score_tier2 >= 4:
            analysis.tier = 2
        elif analysis.score_tier1 >= 3 and analysis.score_tier2 < 2:
            analysis.tier = 1
        elif analysis.score_tier1 >= analysis.score_tier2 and analysis.score_tier1 > 0 and analysis.score_tier3 < 2:
            analysis.tier = 1
        else:
            analysis.tier = 2  # default balanced

        # Respect max_tier override (e.g. Basic plan only has Tier 1)
        if max_tier_override is not None:
            analysis.tier = min(analysis.tier, max_tier_override)
            analysis.reasons.append(f"Capped to max tier {max_tier_override} by plan quota")

        # ---- Confidence ----
        total = analysis.score_tier1 + analysis.score_tier2 + analysis.score_tier3
        best = max(analysis.score_tier1, analysis.score_tier2, analysis.score_tier3)
        if total > 0:
            analysis.confidence = min(0.98, best / total if best != analysis.score_tier2 else best / max(total, 1))
        else:
            analysis.confidence = 0.4
            analysis.reasons.append("No strong signals → default Tier 2")

        return analysis


# Singleton
classifier = QueryClassifier()