/* CCNA: add stable numbering and an entry to the existing laboratory catalogue. */
(() => {
  "use strict";
  const frame = document.getElementById("appFrame");
  let patchedDocument = null;
  let activeSectionNumber = null;
  const COURSE_LABEL = "CCNA (200-301)";

  // Oznaczenia odnoszą się tylko do głównego kursu sieciowego;
  // nie zmieniają nazw sekcji, laboratoriów ani identyfikatorów postępu.
  function labelCertification(doc) {
    if (!doc) return;
    doc.querySelectorAll(
      "#sectionGrid .section-card h3, " +
      "#adminSectionGrid .admin-section-card h3, " +
      "#moduleTitle, #moduleContent .view-head .badge"
    ).forEach(heading => {
      if ((heading.textContent || "").trim() === "CCNA") {
        heading.textContent = COURSE_LABEL;
      }
    });

    const courseBadge = doc.querySelector("#moduleContent .admin-intro .badge");
    if (courseBadge?.textContent.trim() === "Cyberbezpieczeństwo • CCNA") {
      courseBadge.textContent = "Cyberbezpieczeństwo • CCNA 200-301";
    }
    const labBadge = doc.querySelector("#moduleContent .view-head .badge");
    if (labBadge?.textContent.trim() === "Laboratorium CCNA") {
      labBadge.textContent = "Laboratorium CCNA 200-301";
    }
  }

  function numberCards(doc, containerId, prefix = "") {
    const grid = doc.getElementById(containerId);
    if (!grid) return;
    const cards = [...grid.querySelectorAll(":scope > article")];
    cards.forEach((card, i) => {
      const heading = card.querySelector("h3,h2,h4");
      if (!heading || heading.querySelector(".ccna-section-number")) return;
      const ordinal = prefix + (i + 1);
      if (!/^\s*\d+(?:\.\d+)*[.)]\s/.test(heading.textContent || "")) {
        const number = doc.createElement("span");
        number.className = "ccna-section-number";
        number.textContent = ordinal + ".";
        heading.prepend(number);
      }
      if (containerId === "partSectionGrid") {
        card.addEventListener("click", () => { activeSectionNumber = i + 1; }, {capture: true});
        card.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") activeSectionNumber = i + 1;
        }, {capture: true});
      }
    });
  }
  function numberSubsections(doc) {
    const heading = doc.querySelector("#subsectionGrid")?.closest("section")?.querySelector("h2");
    const match = (heading?.textContent || "").match(/(?:sekcja|section)\s*(\d+)/i);
    const section = match ? Number(match[1]) : (activeSectionNumber || 1);
    numberCards(doc, "subsectionGrid", section + ".");
    hideEmptyQuestionBadges(doc);
  }
  // WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-SOURCE-CLEANUP-01 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // Keep subsection cards truthful: a lab with no question bank has no "0 pytań" badge.
  function hideEmptyQuestionBadges(doc) {
    doc.getElementById("subsectionGrid")?.querySelectorAll(".mini-chip.soft").forEach(chip => {
      if (/^0\s+pytań$/i.test((chip.textContent || "").trim())) chip.remove();
    });
  }

  // Source provenance and video timestamps belong in the internal curriculum audit,
  // not in the learner-facing CCNA notes. Preserve explanations and command syntax.
  function cleanLearnerNote(doc) {
    const note = doc.getElementById("noteText");
    if (!note) return;
    note.querySelectorAll("p, li, .note-source").forEach(block => {
      if (/^(?:Podstawa|Materiał|Źródło(?: główne| dodatkowe| opracowania)?|Źródła(?: główne| dodatkowe)?|Uzupełnienia spoza filmu|Main source|Primary source|Additional source):/i.test((block.textContent || "").trim())) block.remove();
    });
    note.querySelectorAll(".note-lead").forEach(lead => {
      const sourceStart = lead.innerHTML.search(/(?:^|\s|>)(?:Materiał|Podstawa|Źródło(?: główne| dodatkowe| opracowania)?|Źródła(?: główne| dodatkowe)?|Uzupełnienia spoza filmu|Main source|Primary source|Additional source):\s*/i);
      if (sourceStart >= 0) lead.innerHTML = lead.innerHTML.slice(0, sourceStart).trim();
    });
    const walker = doc.createTreeWalker(note, 4);
    let node;
    while ((node = walker.nextNode())) {
      const original = node.nodeValue || "";
      const cleaned = original
        .replace(/\s*\[(?:uzupełnienie|źródło|materiał):[^\]\r\n]{0,160}\]/gi, "")
        .replace(/\s*\[[^\]\r\n]{0,120}\b\d{1,2}:\d{2}\b[^\]\r\n]{0,120}\]/g, "")
        .replace(/\s*\([^()\r\n]{0,120}\b\d{1,2}:\d{2}\b[^()\r\n]{0,120}\)/g, "")
        .replace(/\b\d{1,2}:\d{2}(?:\s*[–-]\s*\d{1,2}:\d{2})?\b/g, "")
        // WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-PROVENANCE-03 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
        .replace(/\s+(?:pokazany|pokazana|przedstawiony|przedstawiona|omawiany|omawiana)\s+w\s+(?:tej\s+)?(?:lekcji|filmie|materiale)\b/gi, "")
        .replace(/\bPytanie\s+(?:OCG|JITL)\b/gi, "Pytanie")
        // Replace cross-references to the video while preserving the technical note.
        .replace(/\bw tej lekcji\b/gi, "w tym zagadnieniu");
      if (cleaned !== original) node.nodeValue = cleaned;
    }
  }

  // WIEDORA-CHANGE: WD-20261031-WIE-161-CCNA-REPORTS-02 | TASK: WIE-161 | AUTHOR: ChatGPT / GPT-6
  // Laboratories belong only to dedicated laboratory subsections; never gate
  // a theory lesson or its examination on a lab attached by old course data.
  function separateTheoryFromLaboratories(w) {
    const changed = new Set();
    if (typeof w.getLearningSections !== "function") return changed;
    w.getLearningSections().forEach(section => {
      (section.subsections || []).forEach(sub => {
        if (sub.type !== "learning-subsection") return;
        const label = [sub.id, sub.title, sub.chapter].filter(Boolean).join(" ");
        if (/laboratorium|\blab\b/i.test(label)) return;
        if (sub.lab || sub.labAuditKey) changed.add(section.id + "/" + sub.id);
        delete sub.lab;
        delete sub.labAuditKey;
      });
    });
    return changed;
  }

  // router.js restores deep links BEFORE this adapter installs. Re-render only
  // a theory topic whose lab metadata changed, so the tab and exam gate agree.
  function refreshInitialTheoryRoute(w, changed, currentPath = location.pathname) {
    const match = currentPath.match(/\/sekcja\/([^/]+)\/temat\/([^/]+)\/?$/);
    if (!match || !w.document.querySelector("#subsectionModeContent")) return;
    let sectionId, subsectionId;
    try {
      sectionId = decodeURIComponent(match[1]);
      subsectionId = decodeURIComponent(match[2]);
    } catch { return; }
    if (!changed.has(sectionId + "/" + subsectionId)) return;
    const currentMode = w.document.querySelector(".section-mode-tabs [data-sub-mode].active")?.dataset.subMode || "note";
    w.renderSubsection(sectionId, subsectionId, currentMode === "lab" ? "note" : currentMode);
  }

  function hideObsoleteLandingFooter(doc) {
    const footer = doc.querySelector("body > footer");
    if (footer && /^Jednoplikowa aplikacja do nauki cyberbezpieczeństwa i CCNA\s*•\s*wersja\s*1\.18\.0\.?$/i.test((footer.textContent || "").trim())) {
      footer.remove();
    }
  }

  function clarifyTheorySectionPath(doc) {
    const intro = doc.querySelector("#moduleContent .view-head p.muted");
    if (intro && /Ścieżka prowadzi od notatki/.test(intro.textContent || "")) {
      intro.textContent = "Wybierz podsekcję: notatka, fiszki, pytania z dwiema odpowiedziami i egzamin ABCD (80%). Laboratoria są dostępne w osobnych podsekcjach. Tryb nauki jest opcjonalny.";
    }
  }

  function addLaboratoriesLink(w) {
    const host = w.document.getElementById("moduleContent");
    if (!host || host.querySelector(".ccna-laboratory-link, [data-lab-catalog-entry]") || typeof w.renderLaboratories !== "function") return;
    const section = w.document.createElement("section");
    section.className = "ccna-laboratory-link";
    const h = w.document.createElement("h3");h.textContent = "Laboratorium";
    const p = w.document.createElement("p");
    p.textContent = "Wszystkie istniejące laboratoria sieciowe w jednym miejscu, według kolejności kursu.";
    const button = w.document.createElement("button");
    button.type = "button";button.textContent = "Przejdź do laboratoriów";
    button.addEventListener("click", () => w.renderLaboratories());
    section.append(h, p, button);
    host.append(section);
  }
  // Keep note tables legible on phones while preserving their original columns.
  function makeTablesScrollable(doc) {
    const host = doc.getElementById("moduleContent");
    if (!host) return;
    host.querySelectorAll("table").forEach(table => {
      if (table.closest(".ccna-table-scroll")) return;
      const wrapper = doc.createElement("div");
      wrapper.className = "ccna-table-scroll";
      wrapper.tabIndex = 0;
      wrapper.setAttribute("role", "region");
      wrapper.setAttribute("aria-label", "Tabela CCNA – przewijanie poziome");
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  function installResponsiveTables(doc) {
    if (!doc.getElementById("ccna-mobile-table-style")) {
      const style = doc.createElement("style");
      style.id = "ccna-mobile-table-style";
      style.textContent = [
        ".ccna-table-scroll { max-width: 100%; overflow-x: auto; overflow-y: hidden; -webkit-overflow-scrolling: touch; overscroll-behavior-inline: contain; }",
        ".ccna-table-scroll:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }",
        "@media (max-width: 700px) {",
        ".ccna-table-scroll > table { width: max-content !important; min-width: max(100%, 34rem) !important; max-width: none !important; }",
        ".ccna-table-scroll > table th, .ccna-table-scroll > table td { min-width: 7rem; white-space: normal; overflow-wrap: anywhere; }",
        "}"
      ].join("\n");
      doc.head.appendChild(style);
    }
    makeTablesScrollable(doc);
    const host = doc.getElementById("moduleContent");
    if (host) new MutationObserver(() => makeTablesScrollable(doc))
      .observe(host, { childList: true, subtree: true });
  }

  function install() {
    const w = frame?.contentWindow;
    if (!w || typeof w.renderAdministrativeHome !== "function" || patchedDocument === w.document) return;
    patchedDocument = w.document;
    const theoryChanged = separateTheoryFromLaboratories(w);
    hideObsoleteLandingFooter(w.document);
    installResponsiveTables(w.document);
    // Czerwone oznaczenie błędnie wybranej odpowiedzi jest tylko prezentacją.
    // Oceny i poprawne indeksy odpowiedzi nadal pochodzą z istniejącego silnika.
    if (!w.document.getElementById("ccna-wrong-answer-style")) {
      const marker = w.document.createElement("style");
      marker.id = "ccna-wrong-answer-style";
      marker.textContent = `
        #moduleContent button.answer-option.exam-wrong,
        #moduleContent button.answer-option.exam-wrong:disabled {
          border: 2px solid #991b1b !important;
          background: #fecaca !important;
          color: #7f1d1d !important;
          font-weight: 850 !important;
          box-shadow: inset 4px 0 0 #b91c1c, 0 0 0 2px rgba(185, 28, 28, .15) !important;
          opacity: 1 !important;
        }
        #moduleContent button.answer-option.exam-wrong::before {
          content: "✕";
          display: inline-block;
          margin-right: .6em;
          font-weight: 900;
          color: #991b1b;
        }
      `;
      w.document.head.appendChild(marker);
    }
    // The lesson review card used dark text inherited from a dark theme over a pale box.
    // Keep a deliberate high-contrast foreground/background pair on the exact reported card.
    if (!w.document.getElementById("ccna-review-card-contrast-fix")) {
      const style = w.document.createElement("style");
      style.id = "ccna-review-card-contrast-fix";
      style.textContent = [
        "#subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) { background:#f8fafc !important; color:#0f172a !important; border:1px solid #64748b !important; }",
        "#subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) p, #subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) h2, #subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) h3, #subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) label, #subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) strong, #subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) small { color:#0f172a !important; }",
        "#subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) input, #subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) select { background:#fff !important; color:#0f172a !important; border:1px solid #475569 !important; }",
        "#subsectionModeContent > section:nth-of-type(1) > div:nth-of-type(3) a { color:#1d4ed8 !important; }"
      ].join("\n");
      w.document.head.appendChild(style);
    }
    const after = (name, update) => {
      const previous = w[name];
      if (typeof previous !== "function") return;
      w[name] = function(...args) {
        const result = previous.apply(this, args);
        update();
        return result;
      };
    };
    after("renderAdministrativeHome", () => { addLaboratoriesLink(w); labelCertification(w.document); });
    after("renderPart", () => { numberCards(w.document,"partSectionGrid"); labelCertification(w.document); });
    after("renderLearningSection", () => { numberSubsections(w.document); clarifyTheorySectionPath(w.document); });
    after("renderSubsection", () => cleanLearnerNote(w.document));
    after("renderLaboratories", () => labelCertification(w.document));
    after("showHome", () => labelCertification(w.document));
    // The router restores a deep-linked page synchronously on frame load.
    addLaboratoriesLink(w);
    numberCards(w.document,"partSectionGrid");
    numberSubsections(w.document);
    cleanLearnerNote(w.document);
    labelCertification(w.document);
    refreshInitialTheoryRoute(w, theoryChanged);
  }
  frame?.addEventListener("load", install);
  if (frame?.contentDocument?.readyState === "complete") install();
})();
