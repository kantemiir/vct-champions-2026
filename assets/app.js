/* Интерфейс: вкладки, часовой пояс, избранная команда, отрисовка всех разделов из data.js. */
(function () {
  "use strict";
  var D = window.CHAMPIONS, C = window.Core;

  var REG = { AMER: "Americas", EMEA: "EMEA", PAC: "Pacific", CN: "China" };
  var STAGE = { opening: "Первый раунд", winners: "Матч победителей", elim: "Матч на вылет", decider: "Решающий матч" };
  var STATUS = {
    champion: "Чемпион", runnerup: "Финалист", ub: "Верхняя сетка", lb: "Нижняя сетка",
    out: "Вылетел из плей-офф", "group-alive": "Играет в группе", "group-out": "Вылетел в группе"
  };
  var STATUS_ORDER = ["champion", "runnerup", "ub", "lb", "group-alive", "out", "group-out"];
  var VIEWS = { overview: "Обзор", playoffs: "Плей-офф", groups: "Группы", schedule: "Расписание", teams: "Команды", guide: "Гайд" };
  var TZ_LIST = [
    ["Europe/Kaliningrad", "Калининград"], ["Europe/Moscow", "Москва, Санкт-Петербург"], ["Europe/Samara", "Самара"],
    ["Asia/Yekaterinburg", "Екатеринбург"], ["Asia/Omsk", "Омск"], ["Asia/Novosibirsk", "Новосибирск"],
    ["Asia/Krasnoyarsk", "Красноярск"], ["Asia/Irkutsk", "Иркутск"], ["Asia/Yakutsk", "Якутск"],
    ["Asia/Vladivostok", "Владивосток"], ["Asia/Magadan", "Магадан"], ["Asia/Kamchatka", "Камчатка"],
    ["Europe/Kyiv", "Киев"], ["Europe/Minsk", "Минск"], ["Asia/Tbilisi", "Тбилиси"], ["Asia/Yerevan", "Ереван"],
    ["Asia/Baku", "Баку"], ["Asia/Almaty", "Алматы"], ["Asia/Tashkent", "Ташкент"], ["Asia/Dubai", "Дубай"],
    ["Europe/Berlin", "Берлин, Париж"], ["Europe/London", "Лондон"], ["America/New_York", "Нью-Йорк"],
    ["America/Chicago", "Чикаго"], ["America/Los_Angeles", "Лос-Анджелес"], ["America/Sao_Paulo", "Сан-Паулу"],
    ["Asia/Shanghai", "Шанхай"], ["Asia/Singapore", "Сингапур"], ["Asia/Seoul", "Сеул"], ["Asia/Tokyo", "Токио"],
    ["Asia/Kolkata", "Индия"], ["UTC", "UTC"]
  ];

  var state = { tz: "auto", fav: "", focus: "", theme: "auto", sched: "all", tf: "all", reg: "all", q: "" };

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
  function validTz(tz) { try { new Intl.DateTimeFormat("ru-RU", { timeZone: tz }); return true; } catch (e) { return false; } }
  function deviceTz() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } }

  function dtf(o) {
    var x = {};
    for (var k in o) x[k] = o[k];
    if (state.tz !== "auto") x.timeZone = state.tz;
    return new Intl.DateTimeFormat("ru-RU", x);
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
  function tzName() {
    if (state.tz === "auto") return "устройство (" + deviceTz() + ", " + offsetLabel("auto") + ")";
    var hit = TZ_LIST.filter(function (t) { return t[0] === state.tz; })[0];
    return (hit ? hit[1] : state.tz) + " (" + offsetLabel(state.tz) + ")";
  }

  // ---------- общие кусочки разметки ----------
  function teamBtn(code, withCode) {
    var fav = code === state.fav ? " fav-mark" : "";
    return '<button type="button" class="tm" data-team="' + esc(code) + '" title="Подсветить ' + esc(nm(code)) + '">' +
      (withCode ? '<span class="code">' + esc(code) + "</span>" : "") +
      '<span class="tn' + fav + '">' + esc(nm(code)) + "</span></button>";
  }
  function sideHtml(side) { return side.code ? teamBtn(side.code, false) : '<span class="tn">' + esc(side.label) + "</span>"; }
  function chip(cls, text) { return '<span class="chip ' + cls + '">' + esc(text) + "</span>"; }
  function score(m) { return isNum(m.sa) && isNum(m.sb) ? m.sa + "–" + m.sb : ""; }
  function roundLabel(m) {
    if (!m.n) return m.round;
    return /\d$/.test(m.round) ? m.round + ", матч " + m.n : m.round + " " + m.n;
  }
  function when(m) {
    if (m.startUtc) return fmt(m.startUtc, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    return m.dateNote || "дата уточняется";
  }
  function badge(st) {
    if (st === "live") return chip("live", "возможно идёт");
    if (st === "pending") return chip("", "результат уточняется");
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
    var t = r.m.round.replace("Нижняя сетка, ", "");
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function bracketHtml(res, key, now) {
    var cols = [[], [], [], []];
    res.list.forEach(function (r) {
      var inThis = r.m.bracket === key || (key === "ub" && r.m.bracket === "gf");
      if (!inThis) return;
      cols[r.m.bracket === "gf" ? 3 : r.m.col].push(r);
    });
    return '<div class="bracket">' + cols.map(function (c) {
      if (!c.length) return "<div></div>";
      return '<div class="col"><div class="col-h">' + esc(colTitle(c[0])) + "</div>" + c.map(function (r) { return matchCard(r, now); }).join("") + "</div>";
    }).join("") + "</div>";
  }

  // ---------- Обзор ----------
  function champion(res) { return res.byId.GF && res.byId.GF.winner; }

  function heroHtml(res, now) {
    var ch = champion(res);
    if (ch) {
      return '<div class="hero"><div class="hero-k">Чемпион мира 2026</div><div class="hero-team">' + esc(nm(ch)) +
        '</div><div class="muted">Победитель получает ' + esc(D.event.first) + "</div></div>";
    }
    var nx = C.nextMatch(res, now);
    if (!nx) {
      return '<div class="hero"><div class="hero-k">Ближайший матч</div><div class="hero-team">Расписание уточняется</div>' +
        '<div class="muted">Следующие матчи ещё не назначены или ждут результатов предыдущих. Загляните на вкладку «Расписание».</div></div>';
    }
    var live = C.status(nx, now) === "live";
    var meta = live
      ? '<span class="cd now">Начался в ' + esc(hhmm(nx.m.startUtc)) + '</span><span class="muted">Результат появится после обновления данных</span>'
      : '<span class="cd" data-cd="' + esc(nx.m.startUtc) + '"></span><span class="muted">' + esc(when(nx.m)) + "</span>";
    return '<div class="hero"><div class="hero-k">' + (live ? "Идёт сейчас, возможно · " : "Ближайший матч · ") + esc(roundLabel(nx.m)) + " · Bo" + nx.m.bo +
      '</div><div class="hero-vs"><div class="hero-team">' + esc(nm(nx.a.code)) + '</div><div class="v">против</div><div class="hero-team r">' + esc(nm(nx.b.code)) +
      '</div></div><div class="hero-meta">' + meta + "</div></div>";
  }

  function stepsHtml(res, now) {
    var qualified = C.qualified(D).length === 8;
    var ch = champion(res);
    var pDone = !!ch;
    var gm = res.byId.GF;
    return '<div class="steps">' +
      '<div class="step ' + (qualified ? "done" : "now") + '"><b>Группы</b><span>24 сен – 4 окт · ' + (qualified ? "завершены" : "идут") + "</span></div>" +
      '<div class="step ' + (pDone ? "done" : qualified ? "now" : "") + '"><b>Плей-офф</b><span>с 7 окт · ' + (pDone ? "завершён" : qualified ? "идёт" : "скоро") + "</span></div>" +
      '<div class="step ' + (pDone ? "done" : "") + '"><b>Финальные выходные</b><span>16–18 окт · Mercedes-Benz Arena' + (gm ? "" : "") + "</span></div></div>";
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
      line = '<div class="muted">Следующий матч: против ' + esc(opp.code ? nm(opp.code) : opp.label) + ", " + esc(when(next.m)) + "</div>";
    } else if (st === "out" || st === "group-out") {
      line = '<div class="muted">Команда завершила выступление.</div>';
    }
    return '<div class="panel"><div class="panel-b"><div class="li"><b class="fav-mark">' + esc(nm(code)) + "</b>" + chip(st, STATUS[st]) + "</div>" + line + "</div></div>";
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
    }).join("") + "</div>" : '<div class="empty">Сегодня матчей нет</div>';
    return '<div class="panel"><div class="panel-h"><h3>Сегодня</h3><span class="muted">' + esc(tzName()) + "</span></div><div class=\"panel-b\">" + body + "</div></div>";
  }

  function aliveHtml(res) {
    var ps = C.playoffState(D, res);
    var groups = [["champion", "Чемпион"], ["runnerup", "Финалист"], ["ub", "Верхняя сетка"], ["lb", "Нижняя сетка"], ["out", "Вылетели из плей-офф"]];
    var body = groups.map(function (g) {
      var codes = Object.keys(ps).filter(function (c) { return ps[c].where === g[0]; });
      if (!codes.length) return "";
      return '<div class="alive-grp"><h4>' + g[1] + '</h4><div class="pills">' + codes.map(function (c) {
        return '<button type="button" class="pill' + (c === state.fav ? " is-fav" : "") + '" data-team="' + esc(c) + '" data-goto="playoffs">' + esc(nm(c)) + "</button>";
      }).join("") + "</div></div>";
    }).join("");
    return '<div class="panel"><div class="panel-h"><h3>Кто в плей-офф</h3><span class="muted">нажмите на команду, чтобы увидеть её путь</span></div><div class="panel-b">' + body + "</div></div>";
  }

  function factsHtml() {
    var e = D.event;
    return '<div class="facts">' +
      '<div class="fact"><b>16</b><span>команд, по 4 из каждого региона</span></div>' +
      '<div class="fact"><b>' + esc(e.prize) + '</b><span>призовой фонд</span></div>' +
      '<div class="fact"><b>' + esc(e.first) + '</b><span>победителю, финалисту ' + esc(e.second) + ", третьему месту " + esc(e.third) + "</span></div>" +
      '<div class="fact"><b>24 сен – 18 окт</b><span>' + esc(e.city) + "</span></div></div>";
  }

  function renderOverview(res, now) {
    $("view-overview").innerHTML =
      '<div><h2 id="h-overview">VALORANT Champions 2026</h2><p class="lead">Чемпионат мира в Шанхае. Группы по формату GSL, затем плей-офф на 8 команд с верхней и нижней сеткой. Время ниже показано для: ' + esc(tzName()) + ".</p></div>" +
      heroHtml(res, now) + favBlock(res, now) + stepsHtml(res, now) +
      '<div class="two">' + todayHtml(res, now) + aliveHtml(res) + "</div>" + factsHtml();
  }

  // ---------- Плей-офф ----------
  function renderPlayoffs(res, now) {
    var hint = state.focus
      ? '<span>Подсвечена команда ' + esc(nm(state.focus)) + ' <button type="button" class="chip next" data-clear="1" style="border:0;cursor:pointer">Сбросить</button></span>'
      : "<span>Нажмите на название команды, чтобы подсветить её матчи</span>";
    $("view-playoffs").innerHTML =
      '<div class="sec-head"><div><h2 id="h-playoffs">Плей-офф</h2><p class="lead">Восемь команд, double elimination. Все серии Bo3, финал нижней сетки и гранд-финал Bo5. Первое поражение отправляет команду в нижнюю сетку, второе вылет.</p></div>' +
      '<div class="legend"><span><i style="background:var(--win)"></i>победитель серии</span><span><i style="background:var(--live)"></i>матч мог начаться</span>' + hint + "</div></div>" +
      '<div><div class="lane">Верхняя сетка и гранд-финал</div><div class="scroll">' + bracketHtml(res, "ub", now) + "</div></div>" +
      '<div><div class="lane">Нижняя сетка</div><div class="scroll">' + bracketHtml(res, "lb", now) + "</div></div>";
  }

  // ---------- Группы ----------
  function pathText(p) {
    return (p.won ? "В" : "П") + (p.own != null ? " " + p.own + "–" + p.opp : "") + " " + p.vs;
  }
  function renderGroups() {
    var cards = D.groups.map(function (g) {
      var table = C.groupTable(D, g).map(function (r) {
        var t = D.teams[r.code];
        var chipHtml = r.status === "q" ? chip("q", "в плей-офф · " + r.place + " место") : r.status === "out" ? chip("o", "вылет") : chip("", "играет");
        var maps = r.mapsKnown && r.path.length ? "карты " + r.mw + "–" + r.ml + " · " : "";
        return '<div class="t ' + (r.status === "out" ? "out" : "") + '"><div class="nm">' + teamBtn(r.code, false) + "<small>" + REG[t.region] + '</small></div><div class="rec">' + r.w + "–" + r.l +
          '</div><div class="path">' + esc(maps + r.path.map(pathText).join(" · ")) + "</div>" + chipHtml + "</div>";
      }).join("");
      var mini = g.matches.map(function (m) {
        var s = score(m);
        var mid = s ? esc(m.a) + " " + s + " " + esc(m.b) : esc(m.winner ? m.winner + " победил " + (m.winner === m.a ? m.b : m.a) : m.a + " – " + m.b);
        return '<div><span class="st">' + STAGE[m.stage] + "</span><b>" + mid + "</b></div>";
      }).join("");
      return '<div class="card"><h3>Группа ' + g.id + "</h3>" + table + '<div class="mini">' + mini + "</div></div>";
    }).join("");
    $("view-groups").innerHTML =
      '<div class="sec-head"><div><h2 id="h-groups">Групповой этап</h2><p class="lead">Формат GSL: две победы в серии дают плей-офф, два поражения вылет. В каждой группе по одной команде из каждого региона. Записи В и П это победа и поражение в серии, счёт указан по картам.</p></div></div>' +
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
      if (!idx[k]) { idx[k] = { key: k, title: r.m.startUtc ? fmt(r.m.startUtc, { weekday: "long", day: "numeric", month: "long" }) : "Дата уточняется", items: [] }; days.push(idx[k]); }
      idx[k].items.push(r);
    });
    var body = days.length ? days.map(function (d) {
      return '<div class="day"><div class="day-h">' + esc(d.title) + "</div>" + d.items.map(function (r) {
        var st = C.status(r, now);
        var fav = state.fav && (r.a.code === state.fav || r.b.code === state.fav);
        var res2 = st === "done" ? esc(score(r.m)) : st === "upcoming" || st === "scheduled" ? "" : st === "tbd" ? "" : badge(st);
        var tm = r.m.startUtc ? hhmm(r.m.startUtc) : "—";
        var round = roundLabel(r.m) + " · Bo" + r.m.bo + (r.m.startUtc ? "" : " · " + (r.m.dateNote || ""));
        return '<div class="sm' + (st === "live" ? " live" : "") + (fav ? " has-fav" : "") + '"><div class="tm-t">' + esc(tm) +
          '</div><div><div class="teams">' + sideHtml(r.a) + '<span class="vs">против</span>' + sideHtml(r.b) + '</div><div class="rd">' + esc(round) +
          '</div></div><div class="res">' + res2 + "</div></div>";
      }).join("") + "</div>";
    }).join("") : '<div class="empty">Здесь пока ничего нет</div>';
    $("view-schedule").innerHTML =
      '<div class="sec-head"><div><h2 id="h-schedule">Расписание</h2><p class="lead">Время показано для: ' + esc(tzName()) + ". Поменять пояс можно в шапке сайта. Групповой этап завершён, его результаты на вкладке «Группы».</p></div>" +
      '<div class="seg" role="group" aria-label="Фильтр матчей">' +
      [["all", "Все"], ["upcoming", "Предстоящие"], ["played", "Сыгранные"]].map(function (b) {
        return '<button type="button" data-sched="' + b[0] + '" aria-pressed="' + (f === b[0]) + '">' + b[1] + "</button>";
      }).join("") + "</div></div>" + body;
  }

  // ---------- Команды ----------
  function initTeams() {
    var regOpts = '<option value="all">Все регионы</option>' + Object.keys(REG).map(function (k) { return '<option value="' + k + '">' + REG[k] + "</option>"; }).join("");
    $("view-teams").innerHTML =
      '<div><h2 id="h-teams">Команды</h2><p class="lead">Все 16 участников. Звёздочка делает команду «вашей»: она подсвечивается в сетке и расписании.</p></div>' +
      '<div class="filters"><div class="seg" role="group" aria-label="Статус">' +
      [["all", "Все"], ["in", "В игре"], ["out", "Вылетели"]].map(function (b) {
        return '<button type="button" data-tf="' + b[0] + '" aria-pressed="' + (state.tf === b[0]) + '">' + b[1] + "</button>";
      }).join("") + '</div><select id="tf-reg" aria-label="Регион">' + regOpts + '</select>' +
      '<input class="search" id="tf-q" type="search" placeholder="Поиск команды" aria-label="Поиск команды"></div>' +
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
        return '<span class="r ' + (p.won ? "w" : "l") + '">' + (p.won ? "В" : "П") + s + " " + esc(p.vs) + "</span>";
      }));
      return '<div class="tc' + (fav ? " is-fav" : "") + '"><div class="tc-top"><div class="tc-name">' + esc(t.name) +
        '</div><button type="button" class="star" data-star="' + esc(c) + '" aria-pressed="' + fav + '" aria-label="Сделать «' + esc(t.name) + '» моей командой" title="Моя команда">★</button></div>' +
        '<div>' + chip(st, STATUS[st]) + '</div><div class="tc-meta">' + REG[t.region] + " · группа " + t.group + " · корзина " + t.pot +
        '</div><div class="tc-res" title="Результаты серий: В победа, П поражение">' + results.join("") + "</div></div>";
    }).join("") : '<div class="empty" style="grid-column:1/-1">Ничего не найдено</div>';
  }

  // ---------- Гайд ----------
  function renderGuide() {
    var rows = [
      ["Major", "Champions: раз в год, чемпионат мира. В 2026 году в Шанхае."],
      ["S-tier турниры (IEM, BLAST, PGL)", "Masters: два в год. В 2026 году Santiago и London."],
      ["Открытые квалификации, рейтинг VRS", "VCT: четыре региона (Americas, EMEA, Pacific, China), команды-франшизы с постоянным местом в лиге. С 2027 года возвращаются открытые квалификации."],
      ["Путёвка на Major", "На Champions едут двое лучших из плей-офф Stage 2 каждого региона и ещё две команды региона по очкам чемпионата."],
      ["Швейцарка на Major", "Швейцарская система на Masters. На Champions групповой этап в формате GSL."],
      ["Map veto", "Пик и бан карт. Преимущество в выборе у команды с более высоким посевом или у той, что в верхней сетке."],
      ["13 раундов до победы", "Тоже 13, при 12–12 овертайм. Счёт вроде 13–10 читается так же."],
      ["Энтри, лурк, AWPer", "Роли по агентам: дуэлянт (первым заходит на точку), контроллер (дымы), инициатор (флеши и разведка), страж (держит фланг)."],
      ["ADR", "Ближайший аналог ACS: средний боевой счёт за раунд."],
      ["HLTV", "vlr.gg: расписание, результаты, статистика игроков и страницы турниров."]
    ];
    var terms = [
      ["GSL", "Группа из четырёх команд: первый раунд, матч победителей, матч на вылет и решающий матч."],
      ["Матч победителей", "Выигравший сразу выходит в плей-офф с первого места группы, проигравший играет решающий матч."],
      ["Матч на вылет", "Проигравший уходит с турнира, победитель играет решающий матч."],
      ["Решающий матч", "Проигравший в матче победителей против победителя матча на вылет. Выигравший выходит со второго места."],
      ["Верхняя и нижняя сетка", "После первого поражения команда падает в нижнюю сетку. Второе поражение означает вылет."],
      ["Bo3 и Bo5", "Серия до двух или трёх выигранных карт. Bo5 играется только в финале нижней сетки и в гранд-финале."],
      ["Корзина", "Уровень посева при жеребьёвке. В каждой группе по одной команде из каждой корзины и из каждого региона."]
    ];
    $("view-guide").innerHTML =
      '<div><h2 id="h-guide">Гайд для тех, кто из CS</h2><p class="lead">Короткий словарь, чтобы смотреть Valorant так же уверенно, как привычный CS.</p></div>' +
      '<div class="panel"><div class="panel-h"><h3>CS и Valorant</h3></div><div class="twrap"><table class="tbl"><thead><tr><th>В CS</th><th>В Valorant</th></tr></thead><tbody>' +
      rows.map(function (r) { return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td></tr>"; }).join("") + "</tbody></table></div></div>" +
      '<div><div class="sec-head"><h3>Термины формата</h3></div><div class="dl">' +
      terms.map(function (t) { return "<div><b>" + esc(t[0]) + "</b><span>" + esc(t[1]) + "</span></div>"; }).join("") + "</div></div>" +
      '<div class="panel"><div class="panel-h"><h3>Карты Champions 2026</h3></div><div class="panel-b"><div class="pills">' +
      D.event.maps.map(function (m) { return '<span class="pill" style="cursor:default">' + esc(m) + "</span>"; }).join("") + "</div></div></div>" +
      '<div class="panel"><div class="panel-h"><h3>Где смотреть</h3></div><div class="panel-b"><p style="margin-top:0">Трансляции идут на официальных каналах VALORANT Esports в Twitch и YouTube, есть англоязычные и региональные эфиры.</p>' +
      '<div class="links"><a href="https://www.vlr.gg/event/2766/valorant-champions-2026" target="_blank" rel="noopener">vlr.gg · статистика</a><a href="https://valorantesports.com" target="_blank" rel="noopener">valorantesports.com</a><a href="https://liquipedia.net/valorant/VCT/2026/Champions" target="_blank" rel="noopener">Liquipedia · сетка</a></div></div></div>';
  }

  // ---------- Рендер и роутинг ----------
  function renderAll() {
    var now = Date.now(), res = C.resolveAll(D);
    renderOverview(res, now);
    renderPlayoffs(res, now);
    renderGroups();
    renderSchedule(res, now);
    renderTeamsList();
    $("upd").textContent = "Данные обновлены: " + fmt(D.updated, { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }) + " (" + tzName() + ")";
    tick();
  }

  function route() {
    var id = (location.hash || "#overview").slice(1);
    if (!VIEWS[id]) id = "overview";
    Object.keys(VIEWS).forEach(function (k) { $("view-" + k).hidden = k !== id; });
    var links = document.querySelectorAll("#tabs a");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-view") === id) links[i].setAttribute("aria-current", "page"); else links[i].removeAttribute("aria-current");
    }
    document.title = VIEWS[id] + " · VCT Champions 2026";
    window.scrollTo(0, 0);
  }

  function cdText(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return (d ? d + " д " : "") + p(h) + ":" + p(m) + ":" + p(x);
  }
  var rerenderGuard = false;
  function tick() {
    var els = document.querySelectorAll("[data-cd]");
    var expired = false;
    for (var i = 0; i < els.length; i++) {
      var diff = Date.parse(els[i].getAttribute("data-cd")) - Date.now();
      if (diff <= 0) expired = true;
      els[i].textContent = diff <= 0 ? "начинается" : cdText(diff);
    }
    if (expired && !rerenderGuard) { rerenderGuard = true; setTimeout(function () { rerenderGuard = false; renderAll(); }, 1500); }
  }

  // ---------- Шапка ----------
  function initControls() {
    var tz = $("tz");
    var opts = ['<option value="auto">Как на устройстве · ' + esc(deviceTz()) + " · " + esc(offsetLabel("auto")) + "</option>"];
    TZ_LIST.forEach(function (t) { if (validTz(t[0])) opts.push('<option value="' + t[0] + '">' + esc(t[1]) + " · " + esc(offsetLabel(t[0])) + "</option>"); });
    tz.innerHTML = opts.join("");
    tz.value = state.tz;
    if (tz.value !== state.tz) { state.tz = "auto"; tz.value = "auto"; }
    tz.addEventListener("change", function () { state.tz = tz.value; save("tz", state.tz); renderAll(); });

    var fav = $("fav");
    fav.innerHTML = '<option value="">Не выбрана</option>' + Object.keys(D.teams).sort(function (a, b) { return nm(a).localeCompare(nm(b)); })
      .map(function (c) { return '<option value="' + c + '">' + esc(nm(c)) + "</option>"; }).join("");
    fav.value = state.fav;
    fav.addEventListener("change", function () { state.fav = fav.value; save("fav", state.fav); renderAll(); });

    $("theme").addEventListener("click", function () {
      state.theme = state.theme === "auto" ? "light" : state.theme === "light" ? "dark" : "auto";
      save("theme", state.theme); applyTheme();
    });
  }
  function applyTheme() {
    var root = document.documentElement;
    if (state.theme === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", state.theme);
    $("theme").textContent = "Тема: " + (state.theme === "auto" ? "авто" : state.theme === "light" ? "светлая" : "тёмная");
  }

  // ---------- Клики ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-team],[data-star],[data-sched],[data-tf],[data-clear]") : null;
    if (!t) return;
    if (t.hasAttribute("data-team")) {
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
  state.tz = load("tz", "auto");
  if (state.tz !== "auto" && !validTz(state.tz)) state.tz = "auto";
  state.fav = load("fav", "");
  if (state.fav && !D.teams[state.fav]) state.fav = "";
  state.theme = load("theme", "auto");

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
