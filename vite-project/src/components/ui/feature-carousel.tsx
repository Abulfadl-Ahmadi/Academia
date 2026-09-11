"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowUpLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface FeatureCard {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  /**
   * Position along the site's prism dispersion, in oklch hue degrees. Each card
   * derives its whole palette from this one number so the deck reads as a
   * single spectrum rather than a set of unrelated swatches.
   */
  hue: number;
}

interface FeatureCarouselProps {
  items: FeatureCard[];
  className?: string;
  /** Seconds between automatic advances. 0 disables autoplay. */
  autoplaySeconds?: number;
}

/** Signed distance from the active index, wrapped so the deck has no ends. */
function wrappedOffset(index: number, active: number, count: number) {
  let d = ((index - active) % count + count) % count;
  if (d > count / 2) d -= count;
  return d;
}

export function FeatureCarousel({
  items,
  className,
  autoplaySeconds = 6,
}: FeatureCarouselProps) {
  const count = items.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef<{ x: number; moved: boolean } | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const step = useCallback(
    (delta: number) => setActive((a) => ((a + delta) % count + count) % count),
    [count]
  );

  // Autoplay, held while the visitor is interacting and off entirely for
  // visitors who asked for reduced motion.
  useEffect(() => {
    if (!autoplaySeconds || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      // A hidden tab can't run the card transitions, so advancing there would
      // strand the deck mid-flight (and burn cycles nobody can see).
      if (!document.hidden) step(1);
    }, autoplaySeconds * 1000);

    return () => window.clearInterval(id);
  }, [autoplaySeconds, paused, step]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, moved: false };
    setPaused(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.moved) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) < 45) return;
    drag.moved = true;
    // Dragging left pulls the next card in from the right.
    step(dx < 0 ? 1 : -1);
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      className={cn("fc-root w-full", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        endDrag();
      }}
    >
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="ویژگی‌های آکادمی"
        tabIndex={0}
        onKeyDown={(e) => {
          // Visual order is right-to-left, so ArrowRight steps backward.
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(-1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(1);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="fc-stage"
      >
        {items.map((item, index) => {
          const offset = wrappedOffset(index, active, count);
          const depth = Math.abs(offset);
          const isCenter = offset === 0;
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="fc-card"
              data-center={isCenter || undefined}
              aria-hidden={depth > 2 || undefined}
              style={
                {
                  "--fc-h": item.hue,
                  "--fc-offset": offset,
                  "--fc-depth": depth,
                  zIndex: 20 - depth,
                  // Cards beyond the visible spread are parked, not unmounted,
                  // so the wrap-around never pops a card into existence.
                  opacity: depth > 2 ? 0 : undefined,
                  pointerEvents: depth > 2 ? "none" : undefined,
                } as React.CSSProperties
              }
            >
              <button
                type="button"
                className="fc-hit"
                tabIndex={isCenter ? -1 : 0}
                aria-label={`نمایش ${item.title}`}
                onClick={() => !dragRef.current?.moved && setActive(index)}
                hidden={isCenter}
              />

              <span className="fc-sheen" aria-hidden="true" />
              {/* Oversized echo of the icon, filling the upper field as
                  material rather than leaving it an empty panel. */}
              <Icon className="fc-watermark" strokeWidth={1} aria-hidden="true" />

              <div className="fc-body">
                <div className="fc-head">
                  <span className="fc-chip" aria-hidden="true">
                    <Icon strokeWidth={1.6} />
                  </span>
                  <h3 className="fc-title">{item.title}</h3>
                </div>

                <p className="fc-desc">{item.description}</p>

                <Link
                  to={item.href}
                  className="fc-cta"
                  tabIndex={isCenter ? 0 : -1}
                  onClick={(e) => {
                    if (dragRef.current?.moved) e.preventDefault();
                  }}
                >
                  مشاهده
                  <ArrowUpLeft aria-hidden="true" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <div className="fc-controls">
        <button
          type="button"
          className="fc-nav"
          onClick={() => step(-1)}
          aria-label="ویژگی قبلی"
        >
          <ChevronRight aria-hidden="true" />
        </button>

        <div className="fc-dots" role="tablist" aria-label="انتخاب ویژگی">
          {items.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={item.title}
              className="fc-dot"
              data-on={index === active || undefined}
              onClick={() => setActive(index)}
            />
          ))}
        </div>

        <button
          type="button"
          className="fc-nav"
          onClick={() => step(1)}
          aria-label="ویژگی بعدی"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
