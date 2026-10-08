/* Интерфейс / UI: tabs, language, timezone, favourite team, rendering of every view from data.js.
   Язык по умолчанию английский, русский включается переключателем EN / RU в шапке. */
(function () {
  "use strict";
  var D = window.CHAMPIONS, C = window.Core;

  var state = { lang: "en", tz: "auto", fav: "", focus: "", theme: "auto", sched: "all", tf: "all", reg: "all", q: "", picks: {}, lastPick: "" };
  var LOC = { ru: "ru-RU", en: "en-GB" };
  function L(ru, en) { return state.lang === "ru" ? ru : en; }

  var REG = { AMER: "Americas", EMEA: "EMEA", PAC: "Pacific", CN: "China" };
  var VIEW_IDS = ["overview", "playoffs", "sim", "groups", "schedule", "teams", "guide"];
  function viewName(id) {
    return {
      overview: L("Обзор", "Overview"), playoffs: L("Плей-офф", "Playoffs"), sim: L("Симулятор", "Simulator"),
      groups: L("Группы", "Groups"), schedule: L("Расписание", "Schedule"), teams: L("Команды", "Teams"), guide: L("Гайд", "Guide")
    }[id];
  }
  function stageName(k) {
    return {
      opening: L("Первый раунд", "Opening round"), winners: L("Матч победителей", "Winners' match"),
      elim: L("Матч на вылет", "Elimination match"), decider: L("Решающий матч", "Decider")
    }[k];
  }
  function statusName(k) {
    return {
      champion: L("Чемпион", "Champion"), runnerup: L("Финалист", "Runner-up"), ub: L("Верхняя сетка", "Upper bracket"),
      lb: L("Нижняя сетка", "Lower bracket"), out: L("Вылетел из плей-офф", "Out of playoffs"),
      "group-alive": L("Играет в группе", "Still in group"), "group-out": L("Вылетел в группе", "Out in groups")
    }[k];
  }
  var STATUS_ORDER = ["champion", "runnerup", "ub", "lb", "group-alive", "out", "group-out"];

  // [id, по-русски, in English]
  var TZ_LIST = [
    ["Europe/Kaliningrad", "Калининград", "Kaliningrad"], ["Europe/Moscow", "Москва, Санкт-Петербург", "Moscow, St Petersburg"],
    ["Europe/Samara", "Самара", "Samara"], ["Asia/Yekaterinburg", "Екатеринбург", "Yekaterinburg"], ["Asia/Omsk", "Омск", "Omsk"],
    ["Asia/Novosibirsk", "Новосибирск", "Novosibirsk"], ["Asia/Krasnoyarsk", "Красноярск", "Krasnoyarsk"], ["Asia/Irkutsk", "Иркутск", "Irkutsk"],
    ["Asia/Yakutsk", "Якутск", "Yakutsk"], ["Asia/Vladivostok", "Владивосток", "Vladivostok"], ["Asia/Magadan", "Магадан", "Magadan"],
    ["Asia/Kamchatka", "Камчатка", "Kamchatka"], ["Europe/Kyiv", "Киев", "Kyiv"], ["Europe/Minsk", "Минск", "Minsk"],
    ["Asia/Tbilisi", "Тбилиси", "Tbilisi"], ["Asia/Yerevan", "Ереван", "Yerevan"], ["Asia/Baku", "Баку", "Baku"],
    ["Asia/Almaty", "Алматы", "Almaty"], ["Asia/Tashkent", "Ташкент", "Tashkent"], ["Asia/Dubai", "Дубай", "Dubai"],
    ["Europe/Berlin", "Берлин, Париж", "Berlin, Paris"], ["Europe/London", "Лондон", "London"], ["America/New_York", "Нью-Йорк", "New York"],
    ["America/Chicago", "Чикаго", "Chicago"], ["America/Los_Angeles", "Лос-Анджелес", "Los Angeles"], ["America/Sao_Paulo", "Сан-Паулу", "São Paulo"],
    ["Asia/Shanghai", "Шанхай", "Shanghai"], ["Asia/Singapore", "Сингапур", "Singapore"], ["Asia/Seoul", "Сеул", "Seoul"],
    ["Asia/Tokyo", "Токио", "Tokyo"], ["Asia/Kolkata", "Индия", "India"], ["UTC", "UTC", "UTC"]
  ];

  // Русские строки из data.js, у которых есть английская версия. Неизвестные строки показываются как есть.
  var TR = {
    "Четвертьфинал": "Quarterfinal", "Полуфинал": "Semifinal", "Финал верхней сетки": "Upper bracket final",
    "Нижняя сетка, раунд 1": "Lower bracket, round 1", "Нижняя сетка, раунд 2": "Lower bracket, round 2",
    "Полуфинал нижней сетки": "Lower bracket semifinal", "Финал нижней сетки": "Lower bracket final", "Гранд-финал": "Grand final",
    "16–17 окт": "Oct 16–17", "финальные выходные": "final weekend", "18 окт": "Oct 18", "дата уточняется": "date TBD",
    "Победитель раунда 1": "Winner of round 1", "Проигравший полуфинала": "Loser of semifinal",
    "Шанхай, Китай": "Shanghai, China",
    "Jing'an Sports Center (группы и ранний плей-офф), Mercedes-Benz Arena (топ-4 и гранд-финал)": "Jing'an Sports Center (groups and early playoffs), Mercedes-Benz Arena (top 4 and grand final)",
    "ЧФ 1": "QF 1", "ЧФ 2": "QF 2", "ЧФ 3": "QF 3", "ЧФ 4": "QF 4", "ПФ 1": "SF 1", "ПФ 2": "SF 2",
    "финала верхней": "upper final", "Р1-1 нижней": "LB R1-1", "Р1-2 нижней": "LB R1-2", "Р2-1 нижней": "LB R2-1", "Р2-2 нижней": "LB R2-2",
    "полуфинала нижней": "lower semifinal", "финала нижней": "lower final", "гранд-финала": "grand final"
  };
  function tr(s) { return state.lang === "ru" ? s : (TR[s] || s); }

  // ---------- хранилище (может быть недоступно) ----------
  function load(k, d) { try { var v = localStorage.getItem("vct26." + k); return v === null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem("vct26." + k, v); } catch (e) { /* без сохранения */ } }

  // ---------- утилиты ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function nm(code) { return D.teams[code] ? D.teams[code].name : code; }
  function isNum(x) { return typeof x === "number" && isFinite(x); }
  function validTz(tz) { try { new Intl.DateTimeFormat("en-GB", { timeZone: tz }); return true; } catch (e) { return false; } }
  function deviceTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } }
  // "$2 250 000" из data.js превращаем в "$2,250,000" для английского
  function evMoney(s) { return state.lang === "en" ? String(s).replace(/ /g, ",") : s; }

  function dtf(o) {
    var x = {};
    for (var k in o) x[k] = o[k];
    if (state.tz !== "auto") x.timeZone = state.tz;
    return new Intl.DateTimeFormat(LOC[state.lang], x);
  }
  function fmt(iso, o) { return dtf(o).format(new Date(iso)); }
  function dayKey(iso) { return fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" }); }
  function hhmm(iso) { return fmt(iso, { hour: "2-digit", minute: "2-digit" }); }
  function offsetLabel(tz) {
    try {
      var o = { timeZoneName: "shortOffset", hour: "numeric" };
      if (tz !== "auto") o.timeZone = tz;
      var parts = new Intl.DateTimeFormat("en-US", o).formatToParts(new Date());
      for (var i = 0; i < parts.length; i++) if (parts[i].type === "timeZoneName") return parts[i].value.replace("GMT", "UTC");
    } catch (e) { /* старые браузеры */ }
    return "";
  }
  function tzLabel(t) { return state.lang === "ru" ? t[1] : t[2]; }
  function tzName() {
    if (state.tz === "auto") return L("устройство (", "device (") + deviceTz() + ", " + offsetLabel("auto") + ")";
    var hit = TZ_LIST.filter(function (t) { return t[0] === state.tz; })[0];
    return (hit ? tzLabel(hit) : state.tz) + " (" + offsetLabel(state.tz) + ")";
  }
  function ordinal(n) { return state.lang === "ru" ? n + " место" : n + (n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th") + " place"; }

  // ---------- общие кусочки разметки ----------
  function shortOf(id) {
    var m = D.playoffs.matches.filter(function (x) { return x.id === id; })[0];
    return tr(m ? (m.short || id) : id);
  }
  function sideLabel(side) {
    if (side.kind) return L(side.kind === "W" ? "Победитель " : "Проигравший ", side.kind === "W" ? "Winner of " : "Loser of ") + shortOf(side.ref);
    return tr(side.label);
  }
  function teamBtn(code, withCode) {
    var fav = code === state.fav ? " fav-mark" : "";
    return '<button type="button" class="tm" data-team="' + esc(code) + '" title="' + esc(L("Подсветить ", "Highlight ") + nm(code)) + '">' +
      (withCode ? '<span class="code">' + esc(code) + "</span>" : "") +
      '<span class="tn' + fav + '">' + esc(nm(code)) + "</span></button>";
  }
  function sideHtml(side) { return side.code ? teamBtn(side.code, false) : '<span class="tn">' + esc(sideLabel(side)) + "</span>"; }
  function chip(cls, text) { return '<span class="chip ' + cls + '">' + esc(text) + "</span>"; }
  function score(m) { return isNum(m.sa) && isNum(m.sb) ? m.sa + "–" + m.sb : ""; }
  function roundLabel(m) {
    var rd = tr(m.round);
    if (!m.n) return rd;
    if (state.lang === "ru") return /\d$/.test(m.round) ? m.round + ", матч " + m.n : m.round + " " + m.n;
    return /\d$/.test(rd) ? rd + ", match " + m.n : rd + " " + m.n;
  }
  function when(m) {
    if (m.startUtc) return fmt(m.startUtc, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    return m.dateNote ? tr(m.dateNote) : L("дата уточняется", "date TBD");
  }
  function badge(st) {
    if (st === "live") return chip("live", L("возможно идёт", "may be live"));
    if (st === "pending") return chip("", L("результат уточняется", "result pending"));
    return "";
  }

  // ---------- матч-карточка (сетка) ----------
  function row(side, sc, cls) {
    var focus = state.focus && side.code === state.focus ? " is-focus" : "";
    return '<div class="row ' + cls + (side.code ? "" : " tbd") + focus + '"><div class="n"><i class="dot"></i>' + sideHtml(side) +
      '</div><div class="s">' + (sc == null ? "" : sc) + "</div></div>";
  }
  function matchCard(r, now) {
    var m = r.m, st = C.status(r, now);
    var hasFav = state.fav && (r.a.code === state.fav || r.b.code === state.fav);
    var dim = state.focus && r.a.code !== state.focus && r.b.code !== state.focus;
    var cls = "m" + (st === "live" ? " live" : "") + (hasFav ? " has-fav" : "") + (m.bracket === "gf" ? " gf" : "") + (dim ? " dim" : "");
    var ca = "", cb = "";
    if (r.winner) { ca = r.winner === r.a.code ? "win" : "lose"; cb = r.winner === r.b.code ? "win" : "lose"; }
    var hasScore = isNum(m.sa) && isNum(m.sb);
    return '<div class="' + cls + '" id="m-' + esc(m.id) + '"><div class="m-top"><span>' + esc(when(m)) + "</span><span>" +
      badge(st) + " Bo" + m.bo + "</span></div>" +
      row(r.a, hasScore ? m.sa : null, ca) + row(r.b, hasScore ? m.sb : null, cb) + "</div>";
  }
  function colTitle(r) {
    var t = tr(r.m.round).replace(/^(Нижняя сетка|Lower bracket), /, "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function bracketHtml(res, key, now, cardFn) {
    cardFn = cardFn || matchCard;
    var cols = [[], [], [], []];
    res.list.forEach(function (r) {
      var inThis = r.m.bracket === key || (key === "ub" && r.m.bracket === "gf");
      if (!inThis) return;
      cols[r.m.bracket === "gf" ? 3 : r.m.col].push(r);
    });
    return '<div class="bracket">' + cols.map(function (c) {
      if (!c.length) return "<div></div>";
      return '<div class="col"><div class="col-h">' + esc(colTitle(c[0])) + "</div>" + c.map(function (r) { return cardFn(r, now); }).join("") + "</div>";
    }).join("") + "</div>";
  }

  // ---------- Обзор ----------
  function champion(res) { return res.byId.GF && res.byId.GF.winner; }

  function heroHtml(res, now) {
    var ch = champion(res);
    if (ch) {
      return '<div class="hero"><div class="hero-k">' + L("Чемпион мира 2026", "World champion 2026") + '</div><div class="hero-team">' + esc(nm(ch)) +
        '</div><div class="muted">' + L("Победитель получает ", "The winner receives ") + esc(evMoney(D.event.first)) + "</div></div>";
    }
    var nx = C.nextMatch(res, now);
    if (!nx) {
      return '<div class="hero"><div class="hero-k">' + L("Ближайший матч", "Next match") + '</div><div class="hero-team">' + L("Расписание уточняется", "Schedule to be confirmed") + "</div>" +
        '<div class="muted">' + L("Следующие матчи ещё не назначены или ждут результатов предыдущих. Загляните на вкладку «Расписание».", "The next matches are not scheduled yet or are waiting for earlier results. Check the Schedule tab.") + "</div></div>";
    }
    var live = C.status(nx, now) === "live";
    var meta = live
      ? '<span class="cd now">' + L("Начался в ", "Started at ") + esc(hhmm(nx.m.startUtc)) + '</span><span class="muted">' + L("Результат появится после обновления данных", "The result will appear after the next data update") + "</span>"
      : '<span class="cd" data-cd="' + esc(nx.m.startUtc) + '"></span><span class="muted">' + esc(when(nx.m)) + "</span>";
    return '<div class="hero"><div class="hero-k">' + (live ? L("Идёт сейчас, возможно · ", "Live now, probably · ") : L("Ближайший матч · ", "Next match · ")) + esc(roundLabel(nx.m)) + " · Bo" + nx.m.bo +
      '</div><div class="hero-vs"><div class="hero-team">' + esc(nm(nx.a.code)) + '</div><div class="v">' + L("против", "vs") + '</div><div class="hero-team rt">' + esc(nm(nx.b.code)) +
      '</div></div><div class="hero-meta">' + meta + "</div></div>";
  }

  function stepsHtml(res, now) {
    var qualified = C.qualified(D).length === 8;
    var ch = champion(res);
    var pDone = !!ch;
    return '<div class="steps">' +
      '<div class="step ' + (qualified ? "done" : "now") + '"><b>' + L("Группы", "Groups") + "</b><span>" + L("24 сен – 4 окт · ", "Sep 24 – Oct 4 · ") + (qualified ? L("завершены", "finished") : L("идут", "in progress")) + "</span></div>" +
      '<div class="step ' + (pDone ? "done" : qualified ? "now" : "") + '"><b>' + L("Плей-офф", "Playoffs") + "</b><span>" + L("с 7 окт · ", "from Oct 7 · ") + (pDone ? L("завершён", "finished") : qualified ? L("идёт", "in progress") : L("скоро", "soon")) + "</span></div>" +
      '<div class="step ' + (pDone ? "done" : "") + '"><b>' + L("Финальные выходные", "Final weekend") + "</b><span>" + L("16–18 окт · Mercedes-Benz Arena", "Oct 16–18 · Mercedes-Benz Arena") + "</span></div></div>";
  }

  function favBlock(res, now) {
    if (!state.fav) return "";
    var code = state.fav, st = C.teamStatus(D, res, code);
    var next = res.list.filter(function (r) {
      var s = C.status(r, now);
      return (r.a.code === code || r.b.code === code) && s !== "done" && s !== "tbd";
    }).sort(function (a, b) { return (Date.parse(a.m.startUtc) || 9e15) - (Date.parse(b.m.startUtc) || 9e15); })[0];
    var line = "";
    if (next) {
      var opp = next.a.code === code ? next.b : next.a;
      line = '<div class="muted">' + L("Следующий матч: против ", "Next match: vs ") + esc(opp.code ? nm(opp.code) : sideLabel(opp)) + ", " + esc(when(next.m)) + "</div>";
    } else if (st === "out" || st === "group-out") {
      line = '<div class="muted">' + L("Команда завершила выступление.", "The team's run is over.") + "</div>";
    }
    return '<div class="panel"><div class="panel-b"><div class="li"><b class="fav-mark">' + esc(nm(code)) + "</b>" + chip(st, statusName(st)) + "</div>" + line + "</div></div>";
  }

  function todayHtml(res, now) {
    var key = dayKey(new Date(now).toISOString());
    var list = res.list.filter(function (r) { return r.m.startUtc && r.a.code && r.b.code && dayKey(r.m.startUtc) === key; })
      .sort(function (a, b) { return Date.parse(a.m.startUtc) - Date.parse(b.m.startUtc); });
    var body = list.length ? '<div class="list">' + list.map(function (r) {
      var st = C.status(r, now);
      var right = st === "done" ? "<b class=num>" + esc(score(r.m)) + "</b>" : st === "upcoming" ? "" : badge(st);
      return '<div class="li"><span><b class="num">' + esc(hhmm(r.m.startUtc)) + "</b> &nbsp;" + esc(nm(r.a.code)) + " – " + esc(nm(r.b.code)) +
        ' <small>' + esc(roundLabel(r.m)) + "</small></span><span>" + right + "</span></div>";
    }).join("") + "</div>" : '<div class="empty">' + L("Сегодня матчей нет", "No matches today") + "</div>";
    return '<div class="panel"><div class="panel-h"><h3>' + L("Сегодня", "Today") + '</h3><span class="muted">' + esc(tzName()) + "</span></div><div class=\"panel-b\">" + body + "</div></div>";
  }

  function aliveHtml(res) {
    var ps = C.playoffState(D, res);
    var groups = [["champion", L("Чемпион", "Champion")], ["runnerup", L("Финалист", "Runner-up")], ["ub", L("Верхняя сетка", "Upper bracket")], ["lb", L("Нижняя сетка", "Lower bracket")], ["out", L("Вылетели из плей-офф", "Out of playoffs")]];
    var body = groups.map(function (g) {
      var codes = Object.keys(ps).filter(function (c) { return ps[c].where === g[0]; });
      if (!codes.length) return "";
      return '<div class="alive-grp"><h4>' + g[1] + '</h4><div class="pills">' + codes.map(function (c) {
        return '<button type="button" class="pill' + (c === state.fav ? " is-fav" : "") + '" data-team="' + esc(c) + '" data-goto="playoffs">' + esc(nm(c)) + "</button>";
      }).join("") + "</div></div>";
    }).join("");
    return '<div class="panel"><div class="panel-h"><h3>' + L("Кто в плей-офф", "Who is in the playoffs") + '</h3><span class="muted">' + L("нажмите на команду, чтобы увидеть её путь", "click a team to see its path") + '</span></div><div class="panel-b">' + body + "</div></div>";
  }

  function factsHtml() {
    var e = D.event;
    return '<div class="facts">' +
      '<div class="fact"><b>16</b><span>' + L("команд, по 4 из каждого региона", "teams, 4 from each region") + "</span></div>" +
      '<div class="fact"><b>' + esc(evMoney(e.prize)) + "</b><span>" + L("призовой фонд", "prize pool") + "</span></div>" +
      '<div class="fact"><b>' + esc(evMoney(e.first)) + "</b><span>" + L("победителю, финалисту ", "to the winner, ") + esc(evMoney(e.second)) + L(", третьему месту ", " to the runner-up, ") + esc(evMoney(e.third)) + L("", " for third place") + "</span></div>" +
      '<div class="fact"><b>' + L("24 сен – 18 окт", "Sep 24 – Oct 18") + "</b><span>" + esc(tr(e.city)) + "</span></div></div>";
  }

  function renderOverview(res, now) {
    $("view-overview").innerHTML =
      '<div><h2 id="h-overview">VALORANT Champions 2026</h2><p class="lead">' + L("Чемпионат мира в Шанхае. Группы по формату GSL, затем плей-офф на 8 команд с верхней и нижней сеткой. Время ниже показано для: ", "The world championship in Shanghai. GSL-format groups, then an 8-team double-elimination playoff. Times below are shown for: ") + esc(tzName()) + ".</p></div>" +
      heroHtml(res, now) + favBlock(res, now) + stepsHtml(res, now) +
      '<div class="two">' + todayHtml(res, now) + aliveHtml(res) + "</div>" + factsHtml();
  }

  // ---------- Плей-офф ----------
  function renderPlayoffs(res, now) {
    var hint = state.focus
      ? "<span>" + L("Подсвечена команда ", "Highlighted team: ") + esc(nm(state.focus)) + ' <button type="button" class="chip next" data-clear="1" style="border:0;cursor:pointer">' + L("Сбросить", "Clear") + "</button></span>"
      : "<span>" + L("Нажмите на название команды, чтобы подсветить её матчи", "Click a team name to highlight its matches") + "</span>";
    $("view-playoffs").innerHTML =
      '<div class="sec-head"><div><h2 id="h-playoffs">' + L("Плей-офф", "Playoffs") + '</h2><p class="lead">' + L("Восемь команд, double elimination. Все серии Bo3, финал нижней сетки и гранд-финал Bo5. Первое поражение отправляет команду в нижнюю сетку, второе вылет.", "Eight teams, double elimination. Every series is Bo3 except the lower bracket final and the grand final, which are Bo5. A first loss sends a team to the lower bracket, a second loss eliminates it.") + "</p></div>" +
      '<div class="legend"><span><i style="background:var(--win)"></i>' + L("победитель серии", "series winner") + '</span><span><i style="background:var(--live)"></i>' + L("матч мог начаться", "match may have started") + "</span>" + hint + "</div></div>" +
      '<div><div class="lane">' + L("Верхняя сетка и гранд-финал", "Upper bracket and grand final") + '</div><div class="scroll">' + bracketHtml(res, "ub", now) + "</div></div>" +
      '<div><div class="lane">' + L("Нижняя сетка", "Lower bracket") + '</div><div class="scroll">' + bracketHtml(res, "lb", now) + "</div></div>" +
      prizePanel(D, res, L("Призовые по местам", "Prize money by placement"),
        L("Приз получает каждая команда на этом месте. Места в плей-офф определяются выбыванием из сетки. Вылетевшие в группах делят места 9–16 ($30 000 или $20 000 в зависимости от места), точное место внутри этого диапазона мы не определяем. Источники: esports.net, dotesports.com.",
          "Each team on that placement receives the amount shown. Playoff placements are decided by where a team drops out of the bracket. Teams eliminated in groups share places 9–16 ($30,000 or $20,000 depending on the place); we do not work out the exact place inside that range. Sources: esports.net, dotesports.com."));
  }

  // ---------- Призовые ----------
  function money(n) { return "$" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, state.lang === "ru" ? " " : ","); }
  function moneyRange(a, b) { return a === b ? money(a) : money(a) + "–" + money(b); }
  function prizeRows() {
    var rows = [], lo = null, hi = null;
    (D.event.prizes || []).forEach(function (t) {
      if (t.from > 8) { lo = lo === null ? t.from : Math.min(lo, t.from); hi = hi === null ? t.to : Math.max(hi, t.to); }
      else rows.push({ from: t.from, to: t.to });
    });
    if (lo !== null) rows.push({ from: lo, to: hi });
    return rows;
  }
  function prizePanel(DD, res, title, note) {
    var pl = C.placements(DD, res);
    var body = prizeRows().map(function (r) {
      var pz = C.prize(D, r.from, r.to);
      var codes = Object.keys(pl).filter(function (c) { return pl[c][0] >= r.from && pl[c][1] <= r.to; })
        .sort(function (a, b) { return nm(a).localeCompare(nm(b)); });
      var left = (r.to - r.from + 1) - codes.length;
      var teams = codes.map(function (c) { return teamBtn(c, false); }).join("") + (left > 0 ? '<span class="muted">' + (state.lang === "ru" ? "ещё " + left : left + " more") + "</span>" : "");
      return "<tr><td>" + (r.from === r.to ? r.from : r.from + "–" + r.to) + '</td><td class="num">' + (pz ? esc(moneyRange(pz.min, pz.max)) : "") +
        '</td><td><div class="tl">' + teams + "</div></td></tr>";
    }).join("");
    return '<div class="panel" id="prizes"><div class="panel-h"><h3>' + esc(title) + '</h3><span class="muted">' + L("фонд ", "pool ") + esc(evMoney(D.event.prize)) + "</span></div>" +
      '<div class="twrap"><table class="tbl"><thead><tr><th>' + L("Место", "Place") + "</th><th>" + L("Приз", "Prize") + "</th><th>" + L("Команды", "Teams") + "</th></tr></thead><tbody>" + body + "</tbody></table></div>" +
      (note ? '<div class="panel-b muted" style="font-size:12.5px">' + esc(note) + "</div>" : "") + "</div>";
  }

  // ---------- Симулятор ----------
  function simCard(r, locked) {
    var m = r.m, id = m.id;
    var canPick = !locked[id] && r.a.code && r.b.code;
    var decided = !!r.winner;
    function side(s, which) {
      var win = decided && r.winner === s.code, lose = decided && s.code && r.winner !== s.code;
      var c = "row" + (win ? " win" : "") + (lose ? " lose" : "") + (s.code ? "" : " tbd");
      var sc = locked[id] && isNum(m.sa) && isNum(m.sb) ? (which === "a" ? m.sa : m.sb) : "";
      var inner = '<div class="n"><i class="dot"></i><span class="tn' + (s.code && s.code === state.fav ? " fav-mark" : "") + '">' +
        esc(s.code ? nm(s.code) : sideLabel(s)) + '</span></div><div class="s">' + sc + "</div>";
      if (canPick) {
        return '<button type="button" class="' + c + ' pk" data-pick="' + esc(id) + "|" + esc(s.code) + '" aria-pressed="' + win +
          '" title="' + esc(L("Победит ", "Winner: ") + nm(s.code)) + '">' + inner + "</button>";
      }
      return '<div class="' + c + '">' + inner + "</div>";
    }
    var tag = locked[id] ? L("сыгран", "played") : decided ? L("прогноз", "pick") : "";
    return '<div class="m sim' + (locked[id] ? " locked" : "") + (m.bracket === "gf" ? " gf" : "") + '" id="s-' + esc(id) + '"><div class="m-top"><span>' +
      esc(when(m)) + "</span><span>" + (tag ? chip(locked[id] ? "" : "next", tag) + " " : "") + "Bo" + m.bo + "</span></div>" +
      side(r.a, "a") + side(r.b, "b") + "</div>";
  }
  function savePicks() { try { save("picks", JSON.stringify(state.picks)); } catch (e) { /* без сохранения */ } }
  function randomFill() {
    var real = C.resolveAll(D), picks = {}, k;
    for (k in state.picks) picks[k] = state.picks[k];
    for (var g = 0; g < 30; g++) {
      var sim = C.simulate(D, picks), moved = false;
      for (var i = 0; i < sim.res.list.length; i++) {
        var r = sim.res.list[i];
        if (!real.byId[r.m.id].winner && !r.winner && r.a.code && r.b.code) {
          picks[r.m.id] = Math.random() < 0.5 ? r.a.code : r.b.code; moved = true; break;
        }
      }
      if (!moved) break;
    }
    state.picks = C.simulate(D, picks).picks;
    savePicks();
  }
  function renderSim(real, now) {
    var sim = C.simulate(D, state.picks);
    state.picks = sim.picks;
    var locked = {};
    real.list.forEach(function (r) { if (r.winner) locked[r.m.id] = true; });
    var cardFn = function (r) { return simCard(r, locked); };
    var ch = sim.res.byId.GF && sim.res.byId.GF.winner;
    var pz = ch ? C.prize(D, 1, 1) : null;
    var hero = '<div class="hero"><div class="hero-k">' + L("Ваш прогноз", "Your prediction") + "</div>" + (ch
      ? '<div class="hero-team">' + esc(nm(ch)) + '</div><div class="muted">' + L("Чемпион в вашем прогнозе", "Champion in your prediction") + (pz ? L(", приз ", ", prize ") + esc(money(pz.min)) : "") + "</div>"
      : '<div class="hero-team">' + L("Чемпион пока не выбран", "No champion picked yet") + '</div><div class="muted">' + L("Выберите победителя в каждой серии, и сетка достроится до гранд-финала.", "Pick a winner in every series and the bracket will fill in up to the grand final.") + "</div>") + "</div>";
    var keep = Array.prototype.map.call(document.querySelectorAll("#view-sim .scroll"), function (x) { return x.scrollLeft; });
    $("view-sim").innerHTML =
      '<div class="sec-head"><div><h2 id="h-sim">' + L("Симулятор сетки", "Bracket simulator") + '</h2><p class="lead">' + L("Нажимайте на команду в ещё не сыгранной серии, чтобы выбрать победителя. Победители и проигравшие сами перейдут дальше по верхней и нижней сетке. Повторный клик отменяет выбор, сыгранные матчи закреплены. Ваши выборы хранятся только в этом браузере.", "Click a team in a series that has not been played yet to pick the winner. Winners and losers move on through the upper and lower brackets automatically. Click again to undo a pick; played matches are locked. Your picks are stored only in this browser.") + "</p></div>" +
      '<div class="simbar"><button type="button" class="btn" data-rand="1">' + L("Случайно достроить", "Fill in randomly") + '</button><button type="button" class="btn" data-reset="1">' + L("Сбросить", "Reset") + "</button></div></div>" +
      hero +
      '<div><div class="lane">' + L("Верхняя сетка и гранд-финал", "Upper bracket and grand final") + '</div><div class="scroll">' + bracketHtml(sim.res, "ub", now, cardFn) + "</div></div>" +
      '<div><div class="lane">' + L("Нижняя сетка", "Lower bracket") + '</div><div class="scroll">' + bracketHtml(sim.res, "lb", now, cardFn) + "</div></div>" +
      '<p class="muted" style="margin:0;font-size:12.5px">' + L("Пары второго раунда нижней сетки пока не подтверждены организаторами. Пока их нет, симулятор использует стандартную схему, при которой победитель раунда 1 играет с проигравшим полуфинала из другой половины сетки. Когда реальные пары появятся, они заменят предположение.", "The lower bracket round 2 pairings are not confirmed by the organisers yet. Until they are, the simulator uses the standard scheme in which a round 1 winner plays the semifinal loser from the other half of the bracket. Real pairings will replace this assumption once they appear.") + "</p>" +
      prizePanel(sim.D, sim.res, L("Призовые в вашем прогнозе", "Prize money in your prediction"), "");
    var sc = document.querySelectorAll("#view-sim .scroll");
    for (var i = 0; i < sc.length && i < keep.length; i++) sc[i].scrollLeft = keep[i];
  }

  // ---------- Метка LIVE в шапке ----------
  function renderLive(res, now) {
    var el = $("live");
    var live = res.list.filter(function (r) { return C.status(r, now) === "live"; });
    if (!live.length) { el.hidden = true; el.innerHTML = ""; return; }
    var r = live[0];
    el.hidden = false;
    el.innerHTML = '<i class="pulse"></i>LIVE <span>' + esc(nm(r.a.code)) + " – " + esc(nm(r.b.code)) + (live.length > 1 ? L(" и ещё ", " and ") + (live.length - 1) + L("", " more") : "") + "</span>";
    el.title = L("Матч идёт по расписанию. Результат появится на сайте после обновления данных (раз в час).", "The match is live according to the schedule. The result will appear on the site after the next data update (hourly).");
  }

  // ---------- Группы ----------
  function pathText(p) {
    return L(p.won ? "В" : "П", p.won ? "W" : "L") + (p.own != null ? " " + p.own + "–" + p.opp : "") + " " + p.vs;
  }
  function renderGroups() {
    var cards = D.groups.map(function (g) {
      var table = C.groupTable(D, g).map(function (r) {
        var t = D.teams[r.code];
        var chipHtml = r.status === "q" ? chip("q", L("в плей-офф · " + ordinal(r.place), "playoffs · " + ordinal(r.place))) : r.status === "out" ? chip("o", L("вылет", "out")) : chip("", L("играет", "in play"));
        var maps = r.mapsKnown && r.path.length ? L("карты ", "maps ") + r.mw + "–" + r.ml + " · " : "";
        return '<div class="t ' + (r.status === "out" ? "out" : "") + '"><div class="nm">' + teamBtn(r.code, false) + "<small>" + REG[t.region] + '</small></div><div class="rec">' + r.w + "–" + r.l +
          '</div><div class="path">' + esc(maps + r.path.map(pathText).join(" · ")) + "</div>" + chipHtml + "</div>";
      }).join("");
      var mini = g.matches.map(function (m) {
        var s = score(m);
        var mid = s ? esc(m.a) + " " + s + " " + esc(m.b) : esc(m.winner ? m.winner + L(" победил ", " beat ") + (m.winner === m.a ? m.b : m.a) : m.a + " – " + m.b);
        return '<div><span class="st">' + stageName(m.stage) + "</span><b>" + mid + "</b></div>";
      }).join("");
      return '<div class="card"><h3>' + L("Группа ", "Group ") + g.id + "</h3>" + table + '<div class="mini">' + mini + "</div></div>";
    }).join("");
    $("view-groups").innerHTML =
      '<div class="sec-head"><div><h2 id="h-groups">' + L("Групповой этап", "Group stage") + '</h2><p class="lead">' + L("Формат GSL: две победы в серии дают плей-офф, два поражения вылет. В каждой группе по одной команде из каждого региона. Записи В и П это победа и поражение в серии, счёт указан по картам.", "GSL format: two series wins send a team to the playoffs, two losses eliminate it. Every group has one team from each region. W and L mean a series win and loss; scores are in maps.") + "</p></div></div>" +
      '<div class="groups">' + cards + "</div>";
  }

  // ---------- Расписание ----------
  function renderSchedule(res, now) {
    var all = res.list.slice().sort(function (a, b) {
      var ta = a.m.startUtc ? Date.parse(a.m.startUtc) : 9e15, tb = b.m.startUtc ? Date.parse(b.m.startUtc) : 9e15;
      return ta - tb;
    });
    var f = state.sched;
    var list = all.filter(function (r) {
      var done = C.status(r, now) === "done";
      return f === "all" || (f === "played" ? done : !done);
    });
    var days = [], idx = {};
    list.forEach(function (r) {
      var k = r.m.startUtc ? dayKey(r.m.startUtc) : "later";
      if (!idx[k]) { idx[k] = { key: k, title: r.m.startUtc ? fmt(r.m.startUtc, { weekday: "long", day: "numeric", month: "long" }) : L("Дата уточняется", "Date to be confirmed"), items: [] }; days.push(idx[k]); }
      idx[k].items.push(r);
    });
    var body = days.length ? days.map(function (d) {
      return '<div class="day"><div class="day-h">' + esc(d.title) + "</div>" + d.items.map(function (r) {
        var st = C.status(r, now);
        var fav = state.fav && (r.a.code === state.fav || r.b.code === state.fav);
        var res2 = st === "done" ? esc(score(r.m)) : st === "upcoming" || st === "scheduled" ? "" : st === "tbd" ? "" : badge(st);
        var tm = r.m.startUtc ? hhmm(r.m.startUtc) : "—";
        var round = roundLabel(r.m) + " · Bo" + r.m.bo + (r.m.startUtc ? "" : " · " + (r.m.dateNote ? tr(r.m.dateNote) : ""));
        return '<div class="sm' + (st === "live" ? " live" : "") + (fav ? " has-fav" : "") + '"><div class="tm-t">' + esc(tm) +
          '</div><div><div class="teams">' + sideHtml(r.a) + '<span class="vs">' + L("против", "vs") + "</span>" + sideHtml(r.b) + '</div><div class="rd">' + esc(round) +
          '</div></div><div class="res">' + res2 + "</div></div>";
      }).join("") + "</div>";
    }).join("") : '<div class="empty">' + L("Здесь пока ничего нет", "Nothing here yet") + "</div>";
    $("view-schedule").innerHTML =
      '<div class="sec-head"><div><h2 id="h-schedule">' + L("Расписание", "Schedule") + '</h2><p class="lead">' + L("Время показано для: ", "Times are shown for: ") + esc(tzName()) + L(". Поменять пояс можно в шапке сайта. Групповой этап завершён, его результаты на вкладке «Группы».", ". You can change the time zone in the site header. The group stage is over; its results are on the Groups tab.") + "</p></div>" +
      '<div class="seg" role="group" aria-label="' + esc(L("Фильтр матчей", "Match filter")) + '">' +
      [["all", L("Все", "All")], ["upcoming", L("Предстоящие", "Upcoming")], ["played", L("Сыгранные", "Played")]].map(function (b) {
        return '<button type="button" data-sched="' + b[0] + '" aria-pressed="' + (f === b[0]) + '">' + b[1] + "</button>";
      }).join("") + "</div></div>" + body;
  }

  // ---------- Команды ----------
  function initTeams() {
    var regOpts = '<option value="all">' + L("Все регионы", "All regions") + "</option>" + Object.keys(REG).map(function (k) { return '<option value="' + k + '">' + REG[k] + "</option>"; }).join("");
    $("view-teams").innerHTML =
      '<div><h2 id="h-teams">' + L("Команды", "Teams") + '</h2><p class="lead">' + L("Все 16 участников. Звёздочка делает команду «вашей»: она подсвечивается в сетке и расписании.", "All 16 participants. The star makes a team \"yours\": it is highlighted in the bracket and the schedule.") + "</p></div>" +
      '<div class="filters"><div class="seg" role="group" aria-label="' + esc(L("Статус", "Status")) + '">' +
      [["all", L("Все", "All")], ["in", L("В игре", "In")], ["out", L("Вылетели", "Out")]].map(function (b) {
        return '<button type="button" data-tf="' + b[0] + '" aria-pressed="' + (state.tf === b[0]) + '">' + b[1] + "</button>";
      }).join("") + '</div><select id="tf-reg" aria-label="' + esc(L("Регион", "Region")) + '">' + regOpts + "</select>" +
      '<input class="search" id="tf-q" type="search" placeholder="' + esc(L("Поиск команды", "Search teams")) + '" aria-label="' + esc(L("Поиск команды", "Search teams")) + '"></div>' +
      '<div class="teams-grid" id="team-list"></div>';
    $("tf-reg").value = state.reg;
    $("tf-q").value = state.q;
    $("tf-reg").addEventListener("change", function (e) { state.reg = e.target.value; renderTeamsList(); });
    $("tf-q").addEventListener("input", function (e) { state.q = e.target.value; renderTeamsList(); });
  }
  function renderTeamsList() {
    var res = C.resolveAll(D), ps = C.playoffState(D, res);
    var paths = {};
    D.groups.forEach(function (g) { C.groupTable(D, g).forEach(function (r) { paths[r.code] = r; }); });
    var q = state.q.trim().toLowerCase();
    var list = Object.keys(D.teams).filter(function (c) {
      var st = C.teamStatus(D, res, c), t = D.teams[c];
      var isOut = st === "out" || st === "group-out";
      if (state.tf === "in" && isOut) return false;
      if (state.tf === "out" && !isOut) return false;
      if (state.reg !== "all" && t.region !== state.reg) return false;
      if (q && (t.name + " " + c).toLowerCase().indexOf(q) === -1) return false;
      return true;
    }).sort(function (a, b) {
      var d = STATUS_ORDER.indexOf(C.teamStatus(D, res, a)) - STATUS_ORDER.indexOf(C.teamStatus(D, res, b));
      return d || nm(a).localeCompare(nm(b));
    });
    $("team-list").innerHTML = list.length ? list.map(function (c) {
      var t = D.teams[c], st = C.teamStatus(D, res, c), fav = c === state.fav;
      var results = paths[c].path.map(function (p) { return '<span class="r ' + (p.won ? "w" : "l") + '">' + esc(pathText(p)) + "</span>"; });
      if (ps[c]) results = results.concat(ps[c].results.map(function (p) {
        var s = p.own != null ? " " + p.own + "–" + p.opp : "";
        return '<span class="r ' + (p.won ? "w" : "l") + '">' + L(p.won ? "В" : "П", p.won ? "W" : "L") + s + " " + esc(p.vs) + "</span>";
      }));
      return '<div class="tc' + (fav ? " is-fav" : "") + '"><div class="tc-top"><div class="tc-name">' + esc(t.name) +
        '</div><button type="button" class="star" data-star="' + esc(c) + '" aria-pressed="' + fav + '" aria-label="' + esc(L("Сделать «" + t.name + "» моей командой", "Make " + t.name + " my team")) + '" title="' + esc(L("Моя команда", "My team")) + '">★</button></div>' +
        '<div>' + chip(st, statusName(st)) + '</div><div class="tc-meta">' + REG[t.region] + L(" · группа ", " · group ") + t.group + L(" · корзина ", " · pot ") + t.pot +
        '</div><div class="tc-res" title="' + esc(L("Результаты серий: В победа, П поражение", "Series results: W win, L loss")) + '">' + results.join("") + "</div></div>";
    }).join("") : '<div class="empty" style="grid-column:1/-1">' + L("Ничего не найдено", "Nothing found") + "</div>";
  }

  // ---------- Гайд ----------
  function renderGuide() {
    // [CS по-русски, Valorant по-русски, CS in English, Valorant in English]
    var rows = [
      ["Major", "Champions: раз в год, чемпионат мира. В 2026 году в Шанхае.", "Major", "Champions: once a year, the world championship. In 2026 it is in Shanghai."],
      ["S-tier турниры (IEM, BLAST, PGL)", "Masters: два в год. В 2026 году Santiago и London.", "S-tier events (IEM, BLAST, PGL)", "Masters: two a year. In 2026 they are Santiago and London."],
      ["Открытые квалификации, рейтинг VRS", "VCT: четыре региона (Americas, EMEA, Pacific, China), команды-франшизы с постоянным местом в лиге. С 2027 года возвращаются открытые квалификации.", "Open qualifiers, VRS ranking", "VCT: four regions (Americas, EMEA, Pacific, China), franchised teams with permanent slots in the league. Open qualifiers return in 2027."],
      ["Путёвка на Major", "На Champions едут двое лучших из плей-офф Stage 2 каждого региона и ещё две команды региона по очкам чемпионата.", "Major slot", "The two best teams from each region's Stage 2 playoffs go to Champions, plus two more teams per region by championship points."],
      ["Швейцарка на Major", "Швейцарская система на Masters. На Champions групповой этап в формате GSL.", "Swiss stage at a Major", "The Swiss system is used at Masters. Champions has a GSL-format group stage."],
      ["Map veto", "Пик и бан карт. Преимущество в выборе у команды с более высоким посевом или у той, что в верхней сетке.", "Map veto", "Map picks and bans. The edge in choosing goes to the higher seed or the team in the upper bracket."],
      ["13 раундов до победы", "Тоже 13, при 12–12 овертайм. Счёт вроде 13–10 читается так же.", "First to 13 rounds", "Also 13, with overtime at 12–12. Scores like 13–10 read the same way."],
      ["Энтри, лурк, AWPer", "Роли по агентам: дуэлянт (первым заходит на точку), контроллер (дымы), инициатор (флеши и разведка), страж (держит фланг).", "Entry, lurk, AWPer", "Roles come from agents: duelist (first onto the site), controller (smokes), initiator (flashes and recon), sentinel (holds the flank)."],
      ["ADR", "Ближайший аналог ACS: средний боевой счёт за раунд.", "ADR", "The closest equivalent is ACS: average combat score per round."],
      ["HLTV", "vlr.gg: расписание, результаты, статистика игроков и страницы турниров.", "HLTV", "vlr.gg: schedule, results, player stats and event pages."]
    ];
    var terms = [
      ["GSL", "Группа из четырёх команд: первый раунд, матч победителей, матч на вылет и решающий матч.", "GSL", "A group of four teams: opening round, winners' match, elimination match and decider."],
      ["Матч победителей", "Выигравший сразу выходит в плей-офф с первого места группы, проигравший играет решающий матч.", "Winners' match", "The winner goes straight to the playoffs as the group's first seed; the loser plays the decider."],
      ["Матч на вылет", "Проигравший уходит с турнира, победитель играет решающий матч.", "Elimination match", "The loser is out of the tournament; the winner plays the decider."],
      ["Решающий матч", "Проигравший в матче победителей против победителя матча на вылет. Выигравший выходит со второго места.", "Decider", "The loser of the winners' match against the winner of the elimination match. The winner advances as the second seed."],
      ["Верхняя и нижняя сетка", "После первого поражения команда падает в нижнюю сетку. Второе поражение означает вылет.", "Upper and lower bracket", "After a first loss a team drops to the lower bracket. A second loss means elimination."],
      ["Bo3 и Bo5", "Серия до двух или трёх выигранных карт. Bo5 играется только в финале нижней сетки и в гранд-финале.", "Bo3 and Bo5", "A series to two or three map wins. Bo5 is played only in the lower bracket final and the grand final."],
      ["Корзина", "Уровень посева при жеребьёвке. В каждой группе по одной команде из каждой корзины и из каждого региона.", "Pot", "The seeding level at the draw. Every group has one team from each pot and each region."]
    ];
    var ru = state.lang === "ru";
    $("view-guide").innerHTML =
      '<div><h2 id="h-guide">' + L("Гайд для тех, кто из CS", "A guide for CS fans") + '</h2><p class="lead">' + L("Короткий словарь, чтобы смотреть Valorant так же уверенно, как привычный CS.", "A short dictionary so you can follow Valorant as confidently as CS.") + "</p></div>" +
      '<div class="panel"><div class="panel-h"><h3>' + L("CS и Valorant", "CS and Valorant") + '</h3></div><div class="twrap"><table class="tbl"><thead><tr><th>' + L("В CS", "In CS") + "</th><th>" + L("В Valorant", "In Valorant") + "</th></tr></thead><tbody>" +
      rows.map(function (r) { return "<tr><td>" + esc(ru ? r[0] : r[2]) + "</td><td>" + esc(ru ? r[1] : r[3]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
      '<div><div class="sec-head"><h3>' + L("Термины формата", "Format terms") + '</h3></div><div class="dl">' +
      terms.map(function (t) { return "<div><b>" + esc(ru ? t[0] : t[2]) + "</b><span>" + esc(ru ? t[1] : t[3]) + "</span></div>"; }).join("") + "</div></div>" +
      '<div class="panel"><div class="panel-h"><h3>' + L("Карты Champions 2026", "Champions 2026 maps") + '</h3></div><div class="panel-b"><div class="pills">' +
      D.event.maps.map(function (m) { return '<span class="pill" style="cursor:default">' + esc(m) + "</span>"; }).join("") + "</div></div></div>" +
      '<div class="panel"><div class="panel-h"><h3>' + L("Где смотреть", "Where to watch") + '</h3></div><div class="panel-b"><p style="margin-top:0">' + L("Трансляции идут на официальных каналах VALORANT Esports в Twitch и YouTube, есть англоязычные и региональные эфиры.", "Broadcasts run on the official VALORANT Esports channels on Twitch and YouTube, with English and regional streams.") + "</p>" +
      '<div class="links"><a href="https://www.vlr.gg/event/2766/valorant-champions-2026" target="_blank" rel="noopener">' + L("vlr.gg · статистика", "vlr.gg · stats") + '</a><a href="https://valorantesports.com" target="_blank" rel="noopener">valorantesports.com</a><a href="https://liquipedia.net/valorant/VCT/2026/Champions" target="_blank" rel="noopener">' + L("Liquipedia · сетка", "Liquipedia · bracket") + "</a></div></div></div>";
  }

  // ---------- Статичные тексты страницы ----------
  var STATIC = {
    skip: ["К содержимому", "Skip to content"],
    "brand-sub": ["Шанхай", "Shanghai"],
    "tab-overview": null, "tab-playoffs": null, "tab-sim": null, "tab-groups": null, "tab-schedule": null, "tab-teams": null, "tab-guide": null,
    "lbl-tz": ["Часовой пояс", "Time zone"],
    "lbl-fav": ["Моя команда", "My team"],
    noscript: ["Для работы сайта нужен JavaScript.", "This site needs JavaScript to work."]
  };
  function applyStatic() {
    document.documentElement.lang = state.lang;
    Object.keys(STATIC).forEach(function (k) {
      var el = $(k);
      if (!el) return;
      if (STATIC[k]) el.textContent = L(STATIC[k][0], STATIC[k][1]);
      else el.textContent = viewName(k.slice(4));
    });
    $("brand").setAttribute("aria-label", L("VCT Champions 2026, на главную", "VCT Champions 2026, home"));
    $("tabs").setAttribute("aria-label", L("Разделы сайта", "Site sections"));
    $("tz").setAttribute("aria-label", L("Часовой пояс", "Time zone"));
    $("fav").setAttribute("aria-label", L("Моя команда", "My team"));
    $("theme").setAttribute("aria-label", L("Переключить тему", "Switch theme"));
    $("lang").setAttribute("aria-label", L("Язык сайта", "Site language"));
    var b = document.querySelectorAll("#lang [data-lang]");
    for (var i = 0; i < b.length; i++) b[i].setAttribute("aria-pressed", String(b[i].getAttribute("data-lang") === state.lang));
    $("foot-1").innerHTML = L("Данные собираются из открытых источников и могут содержать неточности. Официальные результаты: ", "Data is collected from public sources and may contain inaccuracies. Official results: ") +
      '<a href="https://valorantesports.com" target="_blank" rel="noopener">valorantesports.com</a>, <a href="https://www.vlr.gg/event/2766/valorant-champions-2026" target="_blank" rel="noopener">vlr.gg</a>, <a href="https://liquipedia.net/valorant/VCT/2026/Champions" target="_blank" rel="noopener">Liquipedia</a>.';
    $("foot-2").textContent = L("Неофициальный фанатский сайт, не связан с Riot Games.", "Unofficial fan site, not affiliated with Riot Games.");
    var desc = L("Сетка плей-офф, групповой этап, расписание в вашем часовом поясе и гайд по VALORANT Champions 2026 в Шанхае.", "Playoff bracket, group stage, schedule in your time zone and a guide to VALORANT Champions 2026 in Shanghai.");
    var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute("content", desc);
    var og = document.querySelector('meta[property="og:description"]'); if (og) og.setAttribute("content", desc);
  }

  // ---------- Рендер и роутинг ----------
  function renderAll() {
    var now = Date.now(), res = C.resolveAll(D);
    renderOverview(res, now);
    renderPlayoffs(res, now);
    renderSim(res, now);
    renderLive(res, now);
    renderGroups();
    renderSchedule(res, now);
    renderTeamsList();
    $("upd").textContent = L("Данные обновлены: ", "Data updated: ") + fmt(D.updated, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " (" + tzName() + ")";
    tick();
  }

  function route() {
    var id = (location.hash || "#overview").slice(1);
    if (VIEW_IDS.indexOf(id) === -1) id = "overview";
    VIEW_IDS.forEach(function (k) { $("view-" + k).hidden = k !== id; });
    var links = document.querySelectorAll("#tabs a");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-view") === id) links[i].setAttribute("aria-current", "page"); else links[i].removeAttribute("aria-current");
    }
    document.title = viewName(id) + " · VCT Champions 2026";
    window.scrollTo(0, 0);
  }

  function cdText(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return (d ? d + L(" д ", "d ") : "") + p(h) + ":" + p(m) + ":" + p(x);
  }
  var rerenderGuard = false;
  function tick() {
    var els = document.querySelectorAll("[data-cd]");
    var expired = false;
    for (var i = 0; i < els.length; i++) {
      var diff = Date.parse(els[i].getAttribute("data-cd")) - Date.now();
      if (diff <= 0) expired = true;
      els[i].textContent = diff <= 0 ? L("начинается", "starting") : cdText(diff);
    }
    if (expired && !rerenderGuard) { rerenderGuard = true; setTimeout(function () { rerenderGuard = false; renderAll(); }, 1500); }
  }

  // ---------- Шапка ----------
  function fillSelects() {
    var tz = $("tz");
    var opts = ['<option value="auto">' + esc(L("Как на устройстве · ", "Device default · ") + deviceTz() + " · " + offsetLabel("auto")) + "</option>"];
    TZ_LIST.forEach(function (t) { if (validTz(t[0])) opts.push('<option value="' + t[0] + '">' + esc(tzLabel(t)) + " · " + esc(offsetLabel(t[0])) + "</option>"); });
    tz.innerHTML = opts.join("");
    tz.value = state.tz;
    if (tz.value !== state.tz) { state.tz = "auto"; tz.value = "auto"; }
    var fav = $("fav");
    fav.innerHTML = '<option value="">' + L("Не выбрана", "None") + "</option>" + Object.keys(D.teams).sort(function (a, b) { return nm(a).localeCompare(nm(b)); })
      .map(function (c) { return '<option value="' + c + '">' + esc(nm(c)) + "</option>"; }).join("");
    fav.value = state.fav;
  }
  function initControls() {
    fillSelects();
    var tz = $("tz"), fav = $("fav");
    tz.addEventListener("change", function () { state.tz = tz.value; save("tz", state.tz); renderAll(); });
    fav.addEventListener("change", function () { state.fav = fav.value; save("fav", state.fav); renderAll(); });
    $("theme").addEventListener("click", function () {
      state.theme = state.theme === "auto" ? "light" : state.theme === "light" ? "dark" : "auto";
      save("theme", state.theme); applyTheme();
    });
  }
  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", state.theme);
    $("theme").textContent = L("Тема: ", "Theme: ") + (state.theme === "auto" ? L("авто", "auto") : state.theme === "light" ? L("светлая", "light") : L("тёмная", "dark"));
  }
  function setLang(lang) {
    if (lang !== "ru" && lang !== "en") return;
    state.lang = lang;
    save("lang", lang);
    applyStatic(); fillSelects(); applyTheme(); initTeams(); renderGuide(); renderAll(); route();
  }

  // ---------- Клики ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-team],[data-star],[data-sched],[data-tf],[data-clear],[data-pick],[data-rand],[data-reset],[data-lang]") : null;
    if (!t) return;
    if (t.hasAttribute("data-lang")) {
      setLang(t.getAttribute("data-lang"));
    } else if (t.hasAttribute("data-pick")) {
      var pk = t.getAttribute("data-pick").split("|");
      if (state.picks[pk[0]] === pk[1]) delete state.picks[pk[0]]; else state.picks[pk[0]] = pk[1];
      savePicks(); renderAll();
      var again = document.querySelector('[data-pick="' + pk.join("|") + '"]');
      if (again && again.focus) again.focus({ preventScroll: true });
    } else if (t.hasAttribute("data-rand")) {
      randomFill(); renderAll();
    } else if (t.hasAttribute("data-reset")) {
      state.picks = {}; savePicks(); renderAll();
    } else if (t.hasAttribute("data-team")) {
      var c = t.getAttribute("data-team");
      state.focus = state.focus === c && !t.hasAttribute("data-goto") ? "" : c;
      renderAll();
      if (t.hasAttribute("data-goto")) location.hash = "#" + t.getAttribute("data-goto");
    } else if (t.hasAttribute("data-star")) {
      var s = t.getAttribute("data-star");
      state.fav = state.fav === s ? "" : s;
      save("fav", state.fav); $("fav").value = state.fav; renderAll();
    } else if (t.hasAttribute("data-sched")) {
      state.sched = t.getAttribute("data-sched"); renderAll();
    } else if (t.hasAttribute("data-tf")) {
      state.tf = t.getAttribute("data-tf");
      var b = document.querySelectorAll("[data-tf]");
      for (var i = 0; i < b.length; i++) b[i].setAttribute("aria-pressed", String(b[i].getAttribute("data-tf") === state.tf));
      renderTeamsList();
    } else if (t.hasAttribute("data-clear")) {
      state.focus = ""; renderAll();
    }
  });

  // ---------- Запуск ----------
  state.lang = load("lang", "en") === "ru" ? "ru" : "en";
  state.tz = load("tz", "auto");
  if (state.tz !== "auto" && !validTz(state.tz)) state.tz = "auto";
  state.fav = load("fav", "");
  if (state.fav && !D.teams[state.fav]) state.fav = "";
  state.theme = load("theme", "auto");
  try {
    var sp = JSON.parse(load("picks", "{}"));
    if (sp && typeof sp === "object" && !Array.isArray(sp)) state.picks = sp;
  } catch (e) { state.picks = {}; }

  applyStatic();
  initControls();
  applyTheme();
  initTeams();
  renderGuide();
  renderAll();
  route();
  window.addEventListener("hashchange", route);
  setInterval(tick, 1000);
  setInterval(renderAll, 60000);
})();
