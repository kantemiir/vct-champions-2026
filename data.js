/*
  Все данные сайта лежат в этом файле. Чтобы обновить сайт, достаточно вписать счёт
  сыгранных матчей (поля sa и sb) и время начала (startUtc, в UTC). Таблицы групп,
  сетка, расписание и статусы команд пересчитываются сами.

  Сторона матча (a и b) это либо код команды (NRG), либо ссылка на итог другого матча:
  "W:UB-QF1" значит «победитель матча UB-QF1», "L:UB-QF1" значит «проигравший».
  Когда матч сыгран, ссылка автоматически превращается в название команды.
  sa это счёт по картам для стороны a, sb для стороны b.
*/
window.CHAMPIONS = {
  updated: "2026-10-08T10:55:00Z",

  event: {
    name: "VALORANT Champions 2026",
    city: "Шанхай, Китай",
    start: "2026-09-24",
    end: "2026-10-18",
    prize: "$2 250 000",
    first: "$1 000 000",
    second: "$400 000",
    third: "$250 000",
    venues: "Jing'an Sports Center (группы и ранний плей-офф), Mercedes-Benz Arena (топ-4 и гранд-финал)",
    maps: ["Abyss", "Ascent", "Haven", "Lotus", "Split", "Summit", "Sunset"]
  },

  // pot: корзина жеребьёвки (1 самая сильная). region: AMER, EMEA, PAC, CN.
  teams: {
    "100T": { name: "100 Thieves", region: "AMER", group: "A", pot: 1 },
    "JDG":  { name: "JD Gaming", region: "CN", group: "A", pot: 2 },
    "FUT":  { name: "FUT Esports", region: "EMEA", group: "A", pot: 3 },
    "T1":   { name: "T1", region: "PAC", group: "A", pot: 4 },
    "GE":   { name: "Global Esports", region: "PAC", group: "B", pot: 1 },
    "LOUD": { name: "LOUD", region: "AMER", group: "B", pot: 2 },
    "EDG":  { name: "EDward Gaming", region: "CN", group: "B", pot: 3 },
    "VIT":  { name: "Team Vitality", region: "EMEA", group: "B", pot: 4 },
    "TYL":  { name: "TYLOO", region: "CN", group: "C", pot: 1 },
    "TL":   { name: "Team Liquid", region: "EMEA", group: "C", pot: 2 },
    "PRX":  { name: "Paper Rex", region: "PAC", group: "C", pot: 3 },
    "G2":   { name: "G2 Esports", region: "AMER", group: "C", pot: 4 },
    "KC":   { name: "Karmine Corp", region: "EMEA", group: "D", pot: 1 },
    "NS":   { name: "Nongshim RedForce", region: "PAC", group: "D", pot: 2 },
    "NRG":  { name: "NRG", region: "AMER", group: "D", pot: 3 },
    "XLG":  { name: "Xi Lai Gaming", region: "CN", group: "D", pot: 4 }
  },

  // stage: opening (первый раунд), winners (матч победителей), elim (матч на вылет), decider (решающий)
  // Если счёт серии неизвестен, но известен победитель, указывается winner.
  groups: [
    { id: "A", matches: [
      { stage: "opening", a: "100T", b: "T1",  sa: 2, sb: 0 },
      { stage: "opening", a: "JDG",  b: "FUT", sa: 0, sb: 2 },
      { stage: "winners", a: "100T", b: "FUT", sa: 2, sb: 0 },
      { stage: "elim",    a: "T1",   b: "JDG", sa: 2, sb: 1 },
      { stage: "decider", a: "T1",   b: "FUT", sa: 2, sb: 0 }
    ]},
    { id: "B", matches: [
      { stage: "opening", a: "VIT",  b: "GE",   sa: 2, sb: 1 },
      { stage: "opening", a: "LOUD", b: "EDG",  sa: 2, sb: 0 },
      { stage: "winners", a: "VIT",  b: "LOUD", sa: 2, sb: 0 },
      { stage: "elim",    a: "GE",   b: "EDG",  sa: 2, sb: 0 },
      { stage: "decider", a: "LOUD", b: "GE",   sa: 2, sb: 0 }
    ]},
    { id: "C", matches: [
      { stage: "opening", a: "PRX", b: "TL",  sa: 2, sb: 1 },
      { stage: "opening", a: "G2",  b: "TYL", sa: 2, sb: 0 },
      { stage: "winners", a: "PRX", b: "G2",  sa: 2, sb: 1 },
      { stage: "elim",    a: "TL",  b: "TYL", winner: "TL" },
      { stage: "decider", a: "G2",  b: "TL",  sa: 2, sb: 0 }
    ]},
    { id: "D", matches: [
      { stage: "opening", a: "NRG", b: "NS",  sa: 2, sb: 0 },
      { stage: "opening", a: "KC",  b: "XLG", sa: 2, sb: 0 },
      { stage: "winners", a: "NRG", b: "KC",  sa: 2, sb: 1 },
      { stage: "elim",    a: "NS",  b: "XLG", sa: 2, sb: 0 },
      { stage: "decider", a: "NS",  b: "KC",  sa: 2, sb: 1 }
    ]}
  ],

  // bracket: ub (верхняя), lb (нижняя), gf (гранд-финал). col: колонка в сетке.
  // dateNote показывается, пока не известно точное время startUtc.
  playoffs: { matches: [
    { id: "UB-QF1", short: "ЧФ 1", bracket: "ub", col: 0, round: "Четвертьфинал", n: 1, bo: 3, startUtc: "2026-10-07T09:00:00Z", a: "NRG", b: "T1", sa: 2, sb: 0 },
    { id: "UB-QF2", short: "ЧФ 2", bracket: "ub", col: 0, round: "Четвертьфинал", n: 2, bo: 3, startUtc: "2026-10-07T12:00:00Z", a: "PRX", b: "LOUD", sa: 0, sb: 2 },
    { id: "UB-QF3", short: "ЧФ 3", bracket: "ub", col: 0, round: "Четвертьфинал", n: 3, bo: 3, startUtc: "2026-10-08T09:00:00Z", a: "100T", b: "G2" },
    { id: "UB-QF4", short: "ЧФ 4", bracket: "ub", col: 0, round: "Четвертьфинал", n: 4, bo: 3, startUtc: "2026-10-08T12:00:00Z", a: "VIT", b: "NS" },

    { id: "UB-SF1", short: "ПФ 1", bracket: "ub", col: 1, round: "Полуфинал", n: 1, bo: 3, startUtc: "2026-10-10T09:00:00Z", a: "W:UB-QF1", b: "W:UB-QF2" },
    { id: "UB-SF2", short: "ПФ 2", bracket: "ub", col: 1, round: "Полуфинал", n: 2, bo: 3, startUtc: "2026-10-10T12:00:00Z", a: "W:UB-QF3", b: "W:UB-QF4" },
    { id: "UB-F", short: "финала верхней",   bracket: "ub", col: 2, round: "Финал верхней сетки", n: 0, bo: 3, dateNote: "16–17 окт", a: "W:UB-SF1", b: "W:UB-SF2" },

    { id: "LB-R1-1", short: "Р1-1 нижней", bracket: "lb", col: 0, round: "Нижняя сетка, раунд 1", n: 1, bo: 3, startUtc: "2026-10-09T09:00:00Z", a: "L:UB-QF1", b: "L:UB-QF2" },
    { id: "LB-R1-2", short: "Р1-2 нижней", bracket: "lb", col: 0, round: "Нижняя сетка, раунд 1", n: 2, bo: 3, startUtc: "2026-10-09T12:00:00Z", a: "L:UB-QF3", b: "L:UB-QF4" },
    { id: "LB-R2-1", short: "Р2-1 нижней", bracket: "lb", col: 1, round: "Нижняя сетка, раунд 2", n: 1, bo: 3, dateNote: "дата уточняется", a: "Победитель раунда 1", b: "Проигравший полуфинала" },
    { id: "LB-R2-2", short: "Р2-2 нижней", bracket: "lb", col: 1, round: "Нижняя сетка, раунд 2", n: 2, bo: 3, dateNote: "дата уточняется", a: "Победитель раунда 1", b: "Проигравший полуфинала" },
    { id: "LB-SF", short: "полуфинала нижней",   bracket: "lb", col: 2, round: "Полуфинал нижней сетки", n: 0, bo: 3, dateNote: "16–17 окт", a: "W:LB-R2-1", b: "W:LB-R2-2" },
    { id: "LB-F", short: "финала нижней",    bracket: "lb", col: 3, round: "Финал нижней сетки", n: 0, bo: 5, dateNote: "финальные выходные", a: "W:LB-SF", b: "L:UB-F" },

    { id: "GF", short: "гранд-финала", bracket: "gf", col: 0, round: "Гранд-финал", n: 0, bo: 5, dateNote: "18 окт", a: "W:UB-F", b: "W:LB-F" }
  ]}
};
