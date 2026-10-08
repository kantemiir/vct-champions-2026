/* Чистая логика без DOM: пересчёт сетки, таблиц групп и статусов матчей из data.js. */
(function (root) {
  "use strict";
  var LIVE_WINDOW_MS = 3.5 * 3600 * 1000; // сколько после старта матч считается идущим, пока нет счёта
  var Core = {};

  function isNum(x) { return typeof x === "number" && isFinite(x); }

  // ---------- Плей-офф ----------

  // Возвращает { byId: { id: {m, a, b, winner, loser} }, list: [...] }.
  // Для каждой стороны: { code } для известной команды или { label } для заглушки.
  Core.resolveAll = function (D) {
    var raw = {};
    D.playoffs.matches.forEach(function (m) { raw[m.id] = m; });
    var cache = {};

    function shortName(id) {
      var m = raw[id];
      return m ? (m.short || id) : id;
    }

    function side(ref) {
      if (typeof ref !== "string") return { label: "" };
      if (D.teams[ref]) return { code: ref };
      var mt = /^([WL]):(.+)$/.exec(ref);
      if (mt) {
        var r = resolve(mt[2]);
        if (r && r.winner && r.a.code && r.b.code) {
          return { code: mt[1] === "W" ? r.winner : r.loser };
        }
        return { label: (mt[1] === "W" ? "Победитель " : "Проигравший ") + shortName(mt[2]), kind: mt[1], ref: mt[2] };
      }
      return { label: ref };
    }

    function resolve(id) {
      if (cache[id]) return cache[id];
      var m = raw[id];
      if (!m) return null;
      var r = { m: m, a: null, b: null, winner: null, loser: null };
      cache[id] = r; // защита от циклов
      r.a = side(m.a);
      r.b = side(m.b);
      if (r.a.code && r.b.code) {
        if (m.winner && (m.winner === r.a.code || m.winner === r.b.code)) r.winner = m.winner;
        else if (isNum(m.sa) && isNum(m.sb) && m.sa !== m.sb) r.winner = m.sa > m.sb ? r.a.code : r.b.code;
        if (r.winner) r.loser = r.winner === r.a.code ? r.b.code : r.a.code;
      }
      return r;
    }

    var byId = {}, list = [];
    D.playoffs.matches.forEach(function (m) { var r = resolve(m.id); byId[m.id] = r; list.push(r); });
    return { byId: byId, list: list };
  };

  // done | tbd (стороны неизвестны) | upcoming | live | pending (время прошло, результата нет) | scheduled (времени нет)
  Core.status = function (r, nowMs) {
    if (r.winner) return "done";
    if (!r.a.code || !r.b.code) return "tbd";
    if (!r.m.startUtc) return "scheduled";
    var t = Date.parse(r.m.startUtc);
    if (nowMs < t) return "upcoming";
    if (nowMs < t + LIVE_WINDOW_MS) return "live";
    return "pending";
  };

  // Ближайший не сыгранный матч с известным временем и известными соперниками.
  Core.nextMatch = function (res, nowMs) {
    var best = null;
    res.list.forEach(function (r) {
      var s = Core.status(r, nowMs);
      if (s !== "upcoming" && s !== "live") return;
      if (!best || Date.parse(r.m.startUtc) < Date.parse(best.m.startUtc)) best = r;
    });
    return best;
  };

  // Положение команд в плей-офф: ub | lb | out | champion | runnerup.
  Core.playoffState = function (D, res) {
    var qualified = Core.qualified(D);
    var st = {};
    qualified.forEach(function (c) { st[c] = { where: "ub", wins: 0, losses: 0, results: [] }; });
    res.list.forEach(function (r) {
      if (!r.winner) return;
      var maps = isNum(r.m.sa) && isNum(r.m.sb);
      [[r.a.code, maps ? r.m.sa : null, maps ? r.m.sb : null, r.b.code], [r.b.code, maps ? r.m.sb : null, maps ? r.m.sa : null, r.a.code]].forEach(function (x) {
        var code = x[0];
        if (!st[code]) return;
        var won = code === r.winner;
        st[code].results.push({ won: won, own: x[1], opp: x[2], vs: x[3], round: r.m.round });
        if (won) st[code].wins++; else st[code].losses++;
      });
      var loser = st[r.loser], winner = st[r.winner];
      if (r.m.bracket === "gf") {
        if (winner) winner.where = "champion";
        if (loser) loser.where = "runnerup";
      } else if (r.m.bracket === "ub") {
        if (loser && loser.where === "ub") loser.where = "lb";
      } else if (r.m.bracket === "lb") {
        if (loser) loser.where = "out";
      }
    });
    return st;
  };

  // ---------- Группы ----------

  Core.groupTable = function (D, group) {
    var rows = {};
    Object.keys(D.teams).forEach(function (c) { if (D.teams[c].group === group.id) rows[c] = { code: c, w: 0, l: 0, mw: 0, ml: 0, mapsKnown: true, path: [] }; });
    group.matches.forEach(function (m) {
      var winner = m.winner || (isNum(m.sa) && isNum(m.sb) && m.sa !== m.sb ? (m.sa > m.sb ? m.a : m.b) : null);
      if (!winner) return;
      var known = isNum(m.sa) && isNum(m.sb);
      [[m.a, m.b, m.sa, m.sb], [m.b, m.a, m.sb, m.sa]].forEach(function (x) {
        var r = rows[x[0]];
        if (!r) return;
        var won = x[0] === winner;
        if (won) r.w++; else r.l++;
        if (known) { r.mw += x[2]; r.ml += x[3]; } else r.mapsKnown = false;
        r.path.push({ won: won, vs: x[1], own: known ? x[2] : null, opp: known ? x[3] : null, stage: m.stage });
      });
    });
    var list = Object.keys(rows).map(function (c) {
      var r = rows[c];
      r.status = r.w >= 2 ? "q" : r.l >= 2 ? "out" : "alive";
      r.place = r.status === "q" ? (r.l === 0 ? 1 : 2) : null;
      return r;
    });
    list.sort(function (x, y) {
      var kx = x.status === "q" ? x.place : x.status === "alive" ? 3 : 4;
      var ky = y.status === "q" ? y.place : y.status === "alive" ? 3 : 4;
      if (kx !== ky) return kx - ky;
      if (y.w !== x.w) return y.w - x.w;
      return (y.mw - y.ml) - (x.mw - x.ml);
    });
    return list;
  };

  Core.qualified = function (D) {
    var out = [];
    D.groups.forEach(function (g) {
      Core.groupTable(D, g).forEach(function (r) { if (r.status === "q") out.push(r.code); });
    });
    return out;
  };

  // Общий статус команды для вкладки «Команды».
  // group-out | group-alive | ub | lb | out | runnerup | champion
  Core.teamStatus = function (D, res, code) {
    var q = Core.qualified(D);
    if (q.indexOf(code) === -1) {
      var g = D.groups.filter(function (x) { return x.id === D.teams[code].group; })[0];
      var row = Core.groupTable(D, g).filter(function (r) { return r.code === code; })[0];
      return row && row.status === "alive" ? "group-alive" : "group-out";
    }
    return Core.playoffState(D, res)[code].where;
  };

  // ---------- Места, призовые и симулятор ----------

  // Места команд: { код: [от, до] }. Только те, чьё место уже определено.
  // Вылет в группе даёт диапазон 9–16, плей-офф даёт точные места по сетке.
  Core.placements = function (D, res) {
    var out = {};
    res.list.forEach(function (r) {
      if (!r.winner) return;
      var m = r.m;
      if (m.bracket === "gf") { out[r.winner] = [1, 1]; out[r.loser] = [2, 2]; }
      else if (m.bracket === "lb") out[r.loser] = m.col >= 3 ? [3, 3] : m.col === 2 ? [4, 4] : m.col === 1 ? [5, 6] : [7, 8];
    });
    D.groups.forEach(function (g) {
      Core.groupTable(D, g).forEach(function (row) { if (row.status === "out" && !out[row.code]) out[row.code] = [9, 16]; });
    });
    return out;
  };

  // Приз за диапазон мест: { min, max } в долларах или null.
  Core.prize = function (D, from, to) {
    var lo = null, hi = null;
    (D.event.prizes || []).forEach(function (t) {
      if (t.to < from || t.from > to) return;
      lo = lo === null ? t.usd : Math.min(lo, t.usd);
      hi = hi === null ? t.usd : Math.max(hi, t.usd);
    });
    return lo === null ? null : { min: lo, max: hi };
  };

  // Симулятор: picks это { id матча: код победителя }. Сыгранные матчи не трогаем,
  // выбор, который перестал быть возможным (сменились соперники), отбрасываем.
  // Возвращает { D, res, picks } для D с достроенной сеткой.
  Core.simulate = function (D, picks) {
    var copies = D.playoffs.matches.map(function (m) {
      var c = {};
      for (var k in m) c[k] = m[k];
      [["a", "simA"], ["b", "simB"]].forEach(function (p) {
        var v = c[p[0]];
        if (c[p[1]] && typeof v === "string" && !D.teams[v] && !/^[WL]:/.test(v)) c[p[0]] = c[p[1]];
      });
      return c;
    });
    var SD = { event: D.event, teams: D.teams, groups: D.groups, playoffs: { matches: copies } };
    var applied = {}, changed = true, guard = 0, res;
    while (changed && guard++ < 30) {
      changed = false;
      res = Core.resolveAll(SD);
      copies.forEach(function (c) {
        var r = res.byId[c.id], p = picks && picks[c.id];
        if (!p || r.winner || applied[c.id]) return;
        if (p === r.a.code || p === r.b.code) { c.winner = p; applied[c.id] = p; changed = true; }
      });
    }
    return { D: SD, res: Core.resolveAll(SD), picks: applied };
  };

  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  else root.Core = Core;
})(typeof window !== "undefined" ? window : this);
