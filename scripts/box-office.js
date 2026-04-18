(function () {
  const films = (window.BOX_OFFICE_FILMS || []).map((film) => ({
    ...film,
    roi: film.worldwide / film.budget
  }));

  const els = {
    actor: document.getElementById("actorFilter"),
    genre: document.getElementById("genreFilter"),
    studio: document.getElementById("studioFilter"),
    year: document.getElementById("yearFilter"),
    reset: document.getElementById("resetFilters"),
    kpis: document.getElementById("kpis"),
    scatter: document.getElementById("scatterChart"),
    actorBars: document.getElementById("actorBars"),
    trend: document.getElementById("trendChart"),
    table: document.getElementById("filmTableBody"),
    insights: document.getElementById("insightList"),
    strategy: document.getElementById("strategySummary")
  };

  if (!els.actor) {
    return;
  }

  const filters = {
    actor: "All",
    genre: "All",
    studio: "All",
    year: "All"
  };

  function uniqueValues(key) {
    return ["All"].concat(
      [...new Set(films.map((film) => film[key]))].sort((a, b) =>
        a > b ? 1 : -1
      )
    );
  }

  function setOptions(select, values) {
    select.innerHTML = values
      .map((value) => `<option value="${value}">${value}</option>`)
      .join("");
  }

  function initializeFilters() {
    setOptions(els.actor, uniqueValues("actor"));
    setOptions(els.genre, uniqueValues("genre"));
    setOptions(els.studio, uniqueValues("studio"));
    setOptions(
      els.year,
      ["All"].concat(
        [...new Set(films.map((film) => film.year))].sort((a, b) => a - b)
      )
    );

    Object.entries({
      actor: els.actor,
      genre: els.genre,
      studio: els.studio,
      year: els.year
    }).forEach(([key, select]) => {
      select.addEventListener("change", () => {
        filters[key] = select.value;
        render();
      });
    });

    els.reset.addEventListener("click", () => {
      Object.keys(filters).forEach((key) => {
        filters[key] = "All";
      });
      els.actor.value = "All";
      els.genre.value = "All";
      els.studio.value = "All";
      els.year.value = "All";
      render();
    });
  }

  function getFilteredFilms() {
    return films.filter((film) => {
      if (filters.actor !== "All" && film.actor !== filters.actor) return false;
      if (filters.genre !== "All" && film.genre !== filters.genre) return false;
      if (filters.studio !== "All" && film.studio !== filters.studio) return false;
      if (filters.year !== "All" && film.year < Number(filters.year)) return false;
      return true;
    });
  }

  function currency(value) {
    return `$${Math.round(value)}M`;
  }

  function number(value) {
    return Intl.NumberFormat("en-US").format(Math.round(value));
  }

  function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  function renderKpis(filteredFilms) {
    const avgWorldwide = average(filteredFilms.map((film) => film.worldwide));
    const avgBudget = average(filteredFilms.map((film) => film.budget));
    const avgRoi = average(filteredFilms.map((film) => film.roi));
    const totalWorldwide = filteredFilms.reduce((sum, film) => sum + film.worldwide, 0);

    const cards = [
      { label: "Films", value: number(filteredFilms.length), note: "Records in current view" },
      { label: "Avg Worldwide", value: currency(avgWorldwide), note: "Average worldwide gross" },
      { label: "Avg Budget", value: currency(avgBudget), note: "Average production budget" },
      { label: "Avg ROI", value: `${avgRoi.toFixed(1)}x`, note: `Total worldwide: ${currency(totalWorldwide)}` }
    ];

    els.kpis.innerHTML = cards
      .map(
        (card) => `
          <article class="kpi-card">
            <p class="mini-label">${card.label}</p>
            <strong>${card.value}</strong>
            <p class="chart-note">${card.note}</p>
          </article>
        `
      )
      .join("");
  }

  function roiColor(roi) {
    if (roi >= 3.5) return "#207868";
    if (roi >= 2.5) return "#c88f2f";
    return "#bf5a36";
  }

  function attachTooltip(target, html) {
    target.addEventListener("mouseenter", () => {
      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.innerHTML = html;
      document.body.appendChild(tooltip);
      target._tooltip = tooltip;
    });

    target.addEventListener("mousemove", (event) => {
      if (!target._tooltip) return;
      target._tooltip.style.left = `${event.clientX + 14}px`;
      target._tooltip.style.top = `${event.clientY + 14}px`;
    });

    target.addEventListener("mouseleave", () => {
      if (target._tooltip) {
        target._tooltip.remove();
        target._tooltip = null;
      }
    });
  }

  function renderScatter(filteredFilms) {
    if (!filteredFilms.length) {
      els.scatter.innerHTML = `<p class="empty-state">No records match the current filter set.</p>`;
      return;
    }

    const width = 680;
    const height = 360;
    const padding = { top: 20, right: 18, bottom: 42, left: 58 };
    const maxBudget = Math.max(...filteredFilms.map((film) => film.budget)) * 1.1;
    const maxWorldwide = Math.max(...filteredFilms.map((film) => film.worldwide)) * 1.1;

    const x = (value) =>
      padding.left + (value / maxBudget) * (width - padding.left - padding.right);
    const y = (value) =>
      height - padding.bottom - (value / maxWorldwide) * (height - padding.top - padding.bottom);

    els.scatter.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Budget versus worldwide gross scatterplot">
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(30,36,48,0.2)" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(30,36,48,0.2)" />
        <text x="${width / 2}" y="${height - 6}" text-anchor="middle" fill="#5f6a75" font-size="12">Budget ($M)</text>
        <text x="16" y="${height / 2}" text-anchor="middle" fill="#5f6a75" font-size="12" transform="rotate(-90 16 ${height / 2})">Worldwide Gross ($M)</text>
        ${filteredFilms
          .map(
            (film) => `
              <circle
                class="scatter-point"
                cx="${x(film.budget)}"
                cy="${y(film.worldwide)}"
                r="7"
                fill="${roiColor(film.roi)}"
                fill-opacity="0.9"
                stroke="white"
                stroke-width="2"
                data-title="${film.title}"
                data-actor="${film.actor}"
                data-budget="${currency(film.budget)}"
                data-worldwide="${currency(film.worldwide)}"
                data-roi="${film.roi.toFixed(1)}x"
              />
            `
          )
          .join("")}
      </svg>
    `;

    els.scatter.querySelectorAll(".scatter-point").forEach((point) => {
      attachTooltip(
        point,
        `<strong>${point.dataset.title}</strong><br>${point.dataset.actor}<br>Budget: ${point.dataset.budget}<br>Worldwide: ${point.dataset.worldwide}<br>ROI: ${point.dataset.roi}`
      );
    });
  }

  function renderActorBars(filteredFilms) {
    if (!filteredFilms.length) {
      els.actorBars.innerHTML = `<p class="empty-state">No actor summary available.</p>`;
      return;
    }

    const grouped = Object.values(
      filteredFilms.reduce((acc, film) => {
        if (!acc[film.actor]) {
          acc[film.actor] = { actor: film.actor, count: 0, worldwide: 0 };
        }
        acc[film.actor].count += 1;
        acc[film.actor].worldwide += film.worldwide;
        return acc;
      }, {})
    )
      .map((entry) => ({
        ...entry,
        avgWorldwide: entry.worldwide / entry.count
      }))
      .sort((a, b) => b.avgWorldwide - a.avgWorldwide)
      .slice(0, 6);

    const maxValue = Math.max(...grouped.map((entry) => entry.avgWorldwide));

    els.actorBars.innerHTML = grouped
      .map(
        (entry) => `
          <div class="bar-row">
            <span>${entry.actor}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${(entry.avgWorldwide / maxValue) * 100}%"></div>
            </div>
            <strong>${currency(entry.avgWorldwide)}</strong>
          </div>
        `
      )
      .join("");
  }

  function renderTrend(filteredFilms) {
    if (!filteredFilms.length) {
      els.trend.innerHTML = `<p class="empty-state">No yearly trend available.</p>`;
      return;
    }

    const width = 500;
    const height = 320;
    const padding = { top: 24, right: 18, bottom: 36, left: 42 };
    const grouped = Object.values(
      filteredFilms.reduce((acc, film) => {
        if (!acc[film.year]) {
          acc[film.year] = { year: film.year, worldwide: 0 };
        }
        acc[film.year].worldwide += film.worldwide;
        return acc;
      }, {})
    ).sort((a, b) => a.year - b.year);

    const maxWorldwide = Math.max(...grouped.map((entry) => entry.worldwide)) * 1.12;
    const minYear = grouped[0].year;
    const maxYear = grouped[grouped.length - 1].year;

    const x = (value) => {
      if (minYear === maxYear) return width / 2;
      return (
        padding.left +
        ((value - minYear) / (maxYear - minYear)) * (width - padding.left - padding.right)
      );
    };
    const y = (value) =>
      height - padding.bottom - (value / maxWorldwide) * (height - padding.top - padding.bottom);

    const points = grouped.map((entry) => `${x(entry.year)},${y(entry.worldwide)}`).join(" ");

    els.trend.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Worldwide gross trend by year">
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="rgba(30,36,48,0.2)" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="rgba(30,36,48,0.2)" />
        <polyline fill="none" stroke="#bf5a36" stroke-width="3.5" points="${points}" />
        ${grouped
          .map(
            (entry) => `
              <circle class="trend-point" cx="${x(entry.year)}" cy="${y(entry.worldwide)}" r="5.5" fill="#1e2430" data-year="${entry.year}" data-worldwide="${currency(entry.worldwide)}" />
              <text x="${x(entry.year)}" y="${height - 14}" text-anchor="middle" fill="#5f6a75" font-size="12">${entry.year}</text>
            `
          )
          .join("")}
      </svg>
    `;

    els.trend.querySelectorAll(".trend-point").forEach((point) => {
      attachTooltip(point, `<strong>${point.dataset.year}</strong><br>Worldwide gross: ${point.dataset.worldwide}`);
    });
  }

  function renderTable(filteredFilms) {
    if (!filteredFilms.length) {
      els.table.innerHTML = `<tr><td colspan="7" class="empty-state">No rows match the current filters.</td></tr>`;
      return;
    }

    els.table.innerHTML = filteredFilms
      .slice()
      .sort((a, b) => b.year - a.year || b.worldwide - a.worldwide)
      .map(
        (film) => `
          <tr>
            <td>${film.title}</td>
            <td>${film.actor}</td>
            <td>${film.year}</td>
            <td>${film.genre}</td>
            <td>${currency(film.budget)}</td>
            <td>${currency(film.worldwide)}</td>
            <td>${film.roi.toFixed(1)}x</td>
          </tr>
        `
      )
      .join("");
  }

  function renderInsights(filteredFilms) {
    if (!filteredFilms.length) {
      els.insights.innerHTML = `<li>No insight is available because the current filter combination returns zero films.</li>`;
      els.strategy.textContent =
        "Broaden the filter set, then restate the core recommendation once enough observations are back in view.";
      return;
    }

    const byActor = Object.values(
      filteredFilms.reduce((acc, film) => {
        if (!acc[film.actor]) {
          acc[film.actor] = { actor: film.actor, count: 0, worldwide: 0, roi: 0 };
        }
        acc[film.actor].count += 1;
        acc[film.actor].worldwide += film.worldwide;
        acc[film.actor].roi += film.roi;
        return acc;
      }, {})
    ).map((entry) => ({
      actor: entry.actor,
      avgWorldwide: entry.worldwide / entry.count,
      avgRoi: entry.roi / entry.count,
      count: entry.count
    }));

    const highestGross = byActor.slice().sort((a, b) => b.avgWorldwide - a.avgWorldwide)[0];
    const highestRoi = byActor.slice().sort((a, b) => b.avgRoi - a.avgRoi)[0];
    const avgBudget = average(filteredFilms.map((film) => film.budget));
    const premiumShare =
      filteredFilms.filter((film) => film.budget >= avgBudget && film.roi >= 3).length /
      filteredFilms.length;

    const insights = [
      `${highestGross.actor} leads the current view on average worldwide gross at ${currency(highestGross.avgWorldwide)} per film.`,
      `${highestRoi.actor} has the strongest average ROI at ${highestRoi.avgRoi.toFixed(1)}x, suggesting a more efficient value profile than pure top-line rank alone.`,
      `${Math.round(premiumShare * 100)}% of films at or above the average budget still clear 3.0x ROI, which helps frame whether star premium is translating into return.`
    ];

    els.insights.innerHTML = insights.map((insight) => `<li>${insight}</li>`).join("");
    els.strategy.textContent =
      "A strong recommendation here would separate actors who mainly amplify franchise-scale revenue from actors who consistently outperform budget on a standalone basis. For a studio slate, that usually means paying a premium only when the actor profile also improves ROI consistency, not only headline gross.";
  }

  function render() {
    const filteredFilms = getFilteredFilms();
    renderKpis(filteredFilms);
    renderScatter(filteredFilms);
    renderActorBars(filteredFilms);
    renderTrend(filteredFilms);
    renderTable(filteredFilms);
    renderInsights(filteredFilms);
  }

  initializeFilters();
  render();
})();
