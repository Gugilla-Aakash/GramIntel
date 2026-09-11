"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryLabel, type RealPlace } from "@/lib/places";
import { searchPlaces, type GeoResult } from "@/lib/geocode";
import { useUiLang } from "@/lib/landing-strings";
import { categoryText, uiText } from "@/lib/ui-strings";

interface SearchBarProps {
  onPickLocation: (r: GeoResult) => void;
  onPickPlace: (id: number) => void;
  places: RealPlace[];
}

type Tab = "location" | "business";

export default function SearchBar({ onPickLocation, onPickPlace, places }: SearchBarProps) {
  const lang = useUiLang();
  const [tab, setTab] = useState<Tab>("location");
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState<GeoResult[]>([]);
  const [locLoading, setLocLoading] = useState(false);
  const [locSearched, setLocSearched] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [locActive, setLocActive] = useState(-1);
  const [bizQuery, setBizQuery] = useState("");
  const [bizActive, setBizActive] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = locQuery.trim();
    if (q.length < 3) {
      abortRef.current?.abort();
      abortRef.current = null;
      setLocResults([]);
      setLocSearched(false);
      setLocLoading(false);
      setLocActive(-1);
      return;
    }
    setLocLoading(true);
    const t = setTimeout(() => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      searchPlaces(q, { signal: ctrl.signal }).then((res) => {
        if (ctrl.signal.aborted) return;
        setLocResults(res.slice(0, 6));
        setLocSearched(true);
        setLocLoading(false);
        setLocOpen(true);
        setLocActive(res.length > 0 ? 0 : -1);
      });
    }, 400);
    return () => {
      clearTimeout(t);
      abortRef.current?.abort();
    };
  }, [locQuery]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const bizMatches = useMemo(() => {
    const q = bizQuery.trim().toLowerCase();
    if (!q) return [];
    return places
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          getCategoryLabel(p.category).toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [bizQuery, places]);

  useEffect(() => {
    setBizActive(bizMatches.length > 0 ? 0 : -1);
  }, [bizMatches.length]);

  function pickLocation(r: GeoResult) {
    setLocQuery(r.name);
    setLocOpen(false);
    setLocActive(-1);
    onPickLocation(r);
  }

  function onLocKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && locResults.length > 0) {
      e.preventDefault();
      setLocOpen(true);
      setLocActive((a) => (a + 1) % locResults.length);
    } else if (e.key === "ArrowUp" && locResults.length > 0) {
      e.preventDefault();
      setLocActive((a) => (a - 1 + locResults.length) % locResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = locActive >= 0 ? locResults[locActive] : locResults[0];
      if (pick) pickLocation(pick);
    } else if (e.key === "Escape") {
      setLocOpen(false);
      setLocActive(-1);
    }
  }

  function onBizKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && bizMatches.length > 0) {
      e.preventDefault();
      setBizActive((a) => (a + 1) % bizMatches.length);
    } else if (e.key === "ArrowUp" && bizMatches.length > 0) {
      e.preventDefault();
      setBizActive((a) => (a - 1 + bizMatches.length) % bizMatches.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = bizActive >= 0 ? bizMatches[bizActive] : bizMatches[0];
      if (pick) onPickPlace(pick.id);
    } else if (e.key === "Escape") {
      setBizActive(-1);
      e.currentTarget.blur();
    }
  }

  const showLocList = locOpen && locSearched && !locLoading && locQuery.trim().length >= 3;
  const showBizList = bizQuery.trim().length > 0;

  return (
    <div className="mx-search" data-tab={tab}>
      <div className="mx-search-tabs" role="tablist" aria-label={uiText(lang, "SEARCH_MODE")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "location"}
          data-active={tab === "location"}
          className="gi-filter-chip mx-search-tab"
          onClick={() => setTab("location")}
        >
          {uiText(lang, "LOCATION")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "business"}
          data-active={tab === "business"}
          className="gi-filter-chip mx-search-tab"
          onClick={() => setTab("business")}
        >
          {uiText(lang, "BUSINESS")}
        </button>
      </div>

      {tab === "location" ? (
        <div className="mx-search-field">
          <label className="mx-search-label" htmlFor="mx-location-input">
            {uiText(lang, "SEARCH_VILLAGE")}
          </label>
          <input
            id="mx-location-input"
            type="search"
            role="searchbox"
            aria-label={uiText(lang, "SEARCH_VILLAGE")}
            aria-expanded={showLocList}
            aria-controls="mx-location-listbox"
            aria-activedescendant={locActive >= 0 ? `mx-loc-opt-${locActive}` : undefined}
            autoComplete="off"
            placeholder={uiText(lang, "TYPE_VILLAGE")}
            className="mx-search-input"
            value={locQuery}
            onChange={(e) => {
              setLocQuery(e.target.value);
              setLocOpen(true);
            }}
            onFocus={() => {
              if (locSearched) setLocOpen(true);
            }}
            onBlur={() => {
              window.setTimeout(() => setLocOpen(false), 120);
            }}
            onKeyDown={onLocKeyDown}
          />
          {locLoading && (
            <p className="mx-search-hint" role="status">
              {uiText(lang, "SEARCHING")}
            </p>
          )}
          {showLocList &&
            (locResults.length > 0 ? (
              <ul id="mx-location-listbox" role="listbox" aria-label={uiText(lang, "MATCHING_PLACES")} className="mx-search-list">
                {locResults.map((r, i) => (
                  <li
                    key={`${r.lat},${r.lng},${i}`}
                    id={`mx-loc-opt-${i}`}
                    role="option"
                    aria-selected={i === locActive}
                    data-active={i === locActive}
                    className="mx-search-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      pickLocation(r);
                    }}
                    onMouseEnter={() => setLocActive(i)}
                  >
                    <span className="mx-search-option-name">{r.name}</span>
                    {r.type && <span className="mx-search-option-meta">{r.type}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mx-search-empty" role="status">
                {uiText(lang, "NO_PLACES")}
              </p>
            ))}
        </div>
      ) : (
        <div className="mx-search-field">
          <label className="mx-search-label" htmlFor="mx-business-input">
            {uiText(lang, "SEARCH_BUSINESSES")}
          </label>
          <input
            id="mx-business-input"
            type="search"
            role="searchbox"
            aria-label={uiText(lang, "SEARCH_BUSINESSES")}
            aria-expanded={showBizList}
            aria-controls="mx-business-listbox"
            aria-activedescendant={bizActive >= 0 ? `mx-biz-opt-${bizActive}` : undefined}
            autoComplete="off"
            placeholder={uiText(lang, "SEARCH_BY_NAME")}
            className="mx-search-input"
            value={bizQuery}
            onChange={(e) => setBizQuery(e.target.value)}
            onKeyDown={onBizKeyDown}
          />
          {showBizList &&
            (bizMatches.length > 0 ? (
              <ul id="mx-business-listbox" role="listbox" aria-label={uiText(lang, "MATCHING_BUSINESSES")} className="mx-search-list">
                {bizMatches.map((p, i) => (
                  <li
                    key={p.id}
                    id={`mx-biz-opt-${i}`}
                    role="option"
                    aria-selected={i === bizActive}
                    data-active={i === bizActive}
                    className="mx-search-option"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onPickPlace(p.id);
                    }}
                    onMouseEnter={() => setBizActive(i)}
                  >
                    <span className="mx-search-option-name">{p.name}</span>
                    <span className="mx-search-option-meta">
                      {categoryText(lang, getCategoryLabel(p.category))} · {p.distanceKm.toFixed(1)} km
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mx-search-empty" role="status">
                {uiText(lang, "NO_BUSINESSES")}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
