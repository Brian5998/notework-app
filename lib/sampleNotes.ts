// Sample notes for a Princeton sophomore, fall 2024.
// ORFE major w/ breadth in LIN, PSY, NEU, HIS, SOC.
// Contradictions and cross-course concept links are intentional.

export type SampleNote = {
  id: string
  title: string
  content: string
  course: string
  courseCode: string
  date: string // ISO string
  tags: string[]
  wordCount: number
}

const sampleNotes: SampleNote[] = [
  // ─────────────────────────── ORF 307 — Optimization ───────────────────────────
  {
    id: 'note-001',
    title: 'LP formulation — first principles',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-09-10T10:15:00Z',
    tags: ['orf307', 'linear-programming', 'formulation', 'foundational'],
    content: `First real lecture. The whole point of an LP is: decision variables $x \\in \\mathbb{R}^n$, linear objective $c^\\top x$, linear constraints $Ax \\leq b$, $x \\geq 0$.

Key idea prof kept hammering: *everything interesting is at a vertex*. The optimum of an LP, if it exists and is bounded, sits at a vertex of the feasible polytope. That's what makes simplex work — you only ever need to check corners, not the whole interior.

Steps to formulate:
- identify decisions → variables
- identify goal → objective (min or max)
- identify limits → constraints
- non-negativity unless you explicitly need free vars

Example from lecture: diet problem. min cost s.t. nutrients ≥ requirements. Super clean.

Things that trip people up:
- strict inequalities aren't allowed (closed polytope only)
- unboundedness vs infeasibility — different failure modes
- writing max as min by negating c

Prof said this will be on midterm 100%. Need to practice turning word problems into standard form fast.

Side note — reminds me of constraint satisfaction in general, curious if any ML stuff uses LP relaxations. Come back to this.`,
    wordCount: 202,
  },
  {
    id: 'note-002',
    title: 'Simplex method — pivots & tableaux',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-09-17T10:15:00Z',
    tags: ['orf307', 'simplex', 'algorithms'],
    content: `Simplex = walk along vertices of the polytope, each step improves (or preserves) the objective.

Setup: convert LP to standard form w/ slack vars. Start at a basic feasible solution (BFS). At each iter:
1. compute reduced costs $\\bar c_j = c_j - c_B^\\top B^{-1} A_j$
2. if all $\\bar c_j \\geq 0$ → optimal, stop
3. else pick entering var (most neg reduced cost, Dantzig's rule)
4. ratio test → leaving var
5. pivot, repeat

Degeneracy is the annoying case. Multiple BFSs at same vertex → can cycle. Bland's rule fixes it (always pick smallest-index var) but slow.

Complexity: worst case exponential (Klee-Minty cube) but in practice polynomial. Why? Nobody fully knows — smoothed analysis is the modern answer I think.

Prof showed a tiny 2D example on the board — you can *literally see* simplex walking the boundary. That clicked for me. Intuition: you're always at a corner, you pick the edge that goes "downhill" in c, you slide until you hit another corner.

Need to practice the tableau form by hand. Homework drops tomorrow.`,
    wordCount: 185,
  },
  {
    id: 'note-003',
    title: 'Big-M method + two-phase',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-09-24T10:15:00Z',
    tags: ['orf307', 'simplex', 'big-m', 'infeasibility'],
    content: `Problem: when origin isn't feasible, how do we start simplex? No obvious BFS.

Two fixes:

**Big-M method.** Add artificial variables $a_i$ to each constraint, put them in the basis to start. Penalize them heavily in objective w/ a huge coefficient $M$. If the LP is feasible, simplex will drive the $a_i$ out of the basis → back to a real BFS.

Pitfall: $M$ has to be "big enough" but not so huge it causes numerical issues. In practice people use two-phase instead.

**Two-phase method.** Phase 1: minimize sum of artificials (ignore real objective). If min = 0, artificials are all 0 and we have a real BFS → phase 2 w/ original objective. If min > 0, original LP is infeasible, done.

Prof said two-phase is "the right answer" — Big-M is a pedagogical crutch b/c it lets you explain everything in one pass, but numerically shaky. Good to know for midterm though.

Small realization: this is basically the same idea as a barrier/penalty method — you're deforming a hard problem into an easy one and letting the solver find its way back. Interior point methods do something spiritually similar.`,
    wordCount: 198,
  },
  {
    id: 'note-004',
    title: 'Duality — every LP has a shadow',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-10-03T10:15:00Z',
    tags: ['orf307', 'duality', 'foundational', 'deep-concept'],
    content: `THIS is the lecture. Duality is the single most beautiful idea in 307 and prof knew it.

Primal: $\\min c^\\top x$ s.t. $Ax \\geq b$, $x \\geq 0$.
Dual: $\\max b^\\top y$ s.t. $A^\\top y \\leq c$, $y \\geq 0$.

Weak duality: for any feasible $x, y$: $c^\\top x \\geq b^\\top y$. Always.
Strong duality: if primal has optimum, dual does too, and they're equal.

What the dual variables MEAN: they're prices. The shadow price on constraint $i$ = how much the optimal objective changes per unit relaxation of $b_i$. That's why $y$ is called the dual price vector. LP optimality = markets clearing.

Complementary slackness: at optimality, for each constraint, either the primal constraint is tight or the dual var is zero. You can't have "slack on both sides." This is incredibly useful for checking optimality by hand.

!! Huge connection I want to come back to: in finance (ORF 335), no-arbitrage pricing basically IS LP duality. A state-price vector is a dual variable. If I can price by "replicating" (primal) or by "arbitrage-free linear pricing" (dual), that's the same theorem wearing different clothes. Need to connect these two classes.

Prof quote: "Every optimization problem has a price. Duality tells you what."`,
    wordCount: 218,
  },
  {
    id: 'note-005',
    title: 'Sensitivity analysis + shadow prices in practice',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-10-10T10:15:00Z',
    tags: ['orf307', 'duality', 'sensitivity', 'shadow-prices'],
    content: `Follow-up to duality. Given optimal basis, how does the solution change when data changes? That's sensitivity.

Three kinds of perturbation:
1. change $b_i$ → objective moves by $y_i^*$ per unit, as long as basis stays optimal
2. change $c_j$ → reduced cost changes; basis valid until a reduced cost flips sign
3. add new variable → check its reduced cost; if < 0, bring it in

Shadow price = $y_i^*$ = economic value of one more unit of resource $i$. In the diet problem: if protein constraint binds, shadow price on protein tells me max I'd pay for 1 more gram.

KEY subtlety: shadow prices are only valid for "small" changes — within the sensitivity range where the current basis stays optimal. Outside that range, the basis changes, and the shadow price jumps discontinuously.

This is basically the same as a marginal cost in econ. Lagrange multipliers in constrained calc. They're all the same object.

Q for prof: is there a nice way to see this in financial markets? My intuition: the shadow price on a budget constraint = discount factor. Am I reaching? Will ask in office hours.`,
    wordCount: 190,
  },
  {
    id: 'note-006',
    title: 'Network flows — max-flow min-cut',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-10-24T10:15:00Z',
    tags: ['orf307', 'networks', 'max-flow', 'duality', 'combinatorial'],
    content: `Post-midterm. Moving into network flows.

Setup: directed graph $G = (V, E)$, each edge has capacity $u_e$, pick source $s$ and sink $t$. Find max flow from $s$ to $t$ respecting capacities.

Max-flow min-cut theorem: max flow value = min capacity of an s-t cut. This is LITERALLY LP duality again — primal is max flow, dual is min cut. I keep seeing the same pattern.

Algorithms:
- Ford-Fulkerson: augmenting paths. Works but can be slow if we pick paths badly (or even fail to terminate on irrational capacities, weird).
- Edmonds-Karp: FF + BFS for shortest augmenting path. Polynomial.
- Push-relabel: faster in practice.

Broader idea — networks show up everywhere:
- traffic routing
- bipartite matching (reduce to max flow!)
- project scheduling
- *emergent behavior* in social networks (thought of Durkheim — a system-level property that doesn't reduce to individual nodes. connect to SOC note from Sep 27?)

This is wild. A social fact is basically a flow-level property of a graph. Going to write this up for the SOC essay maybe.

Prof emphasized: "the hardest part of flow problems is modeling them." The LP is the easy step.`,
    wordCount: 200,
  },
  {
    id: 'note-007',
    title: 'Integer programming + branch-and-bound',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-11-07T10:15:00Z',
    tags: ['orf307', 'integer-programming', 'branch-and-bound', 'complexity'],
    content: `IPs = LPs w/ integrality constraints on some vars. Completely changes the game. LP is polynomial. IP is NP-hard. The feasible region is now a discrete set of lattice points inside the LP polytope.

Standard approach: **branch-and-bound**.
1. solve LP relaxation (drop integrality)
2. if LP solution is already integer → done
3. else pick a fractional var $x_i = 3.7$ → branch into two subproblems: $x_i \\leq 3$ and $x_i \\geq 4$
4. recurse, pruning branches where LP bound is worse than best integer incumbent

The LP relaxation gives us a bound for pruning. Quality of bounds = how fast this runs.

Cutting planes: strengthen LP relaxation by adding inequalities valid for integer points but cut off fractional LP optima. Gomory cuts. Modern solvers do B&B + cuts = "branch-and-cut."

Connection I keep circling back to — LIN 201 Chomsky hierarchy. Regular → context-free → context-sensitive → recursively enumerable. Different languages correspond to different complexity classes. IP sits somewhere in NP. Would be cool to write a 1-pager connecting formal language hierarchy to complexity classes we can actually solve. Could be a junior paper topic even.

Traveling salesman → classic IP. Facility location → IP. Cutting stock → IP. Half of real-world ORFE problems are integer.`,
    wordCount: 213,
  },
  {
    id: 'note-008',
    title: 'Finals review — convexity, descent, learning rate',
    course: 'Optimization',
    courseCode: 'ORF 307',
    date: '2024-12-02T14:00:00Z',
    tags: ['orf307', 'finals-review', 'convexity', 'learning-rate', 'synthesis'],
    content: `FINALS REVIEW. Zooming out of 307 to see the shape of the class.

Most of this semester was LP + duality + flows. But the course ended w/ convex opt and gradient methods — framing LP as one instance of convex minimization.

Gradient descent: $x_{k+1} = x_k - \\eta \\nabla f(x_k)$. The step size $\\eta$ (learning rate) matters enormously.
- too small → crawl
- too large → oscillate or diverge
- ideal for smooth strongly convex $f$: $\\eta = 1/L$ where $L$ is the Lipschitz constant of $\\nabla f$

The name "learning rate" comes from ML but the idea is pure optimization. And now I can't unsee the NEU 200 parallel — synaptic plasticity (LTP) tunes *how much* a synapse updates per experience. Too much plasticity = catastrophic forgetting. Too little = no learning. The brain is literally solving the step-size problem. See NEU note from Nov 1.

Other key ideas to remember for the final:
- convex set, convex function, convex problem — all stack
- Jensen's inequality
- KKT conditions generalize Lagrangian duality to nonlinear
- interior point methods w/ barrier functions

Prof's last lecture line: "LP is the hydrogen atom of optimization." I'm going to quote that in the exam if I get the chance.`,
    wordCount: 220,
  },

  // ─────────────────────── ORF 335 — Financial Mathematics ───────────────────────
  {
    id: 'note-009',
    title: 'Forwards, futures — the simplest derivative',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-09-12T13:30:00Z',
    tags: ['orf335', 'forwards', 'futures', 'no-arbitrage'],
    content: `Forward contract: agree today to buy asset $S$ at future time $T$ for price $F$. No money changes hands today. At $T$: payoff $= S_T - F$.

Pricing a forward via no-arbitrage ("cash and carry"):
- buy asset today for $S_0$, borrow $S_0$ at rate $r$
- at time $T$: owe $S_0 e^{rT}$, own one unit of asset → sell for $S_T$
- net: $S_T - S_0 e^{rT}$

For no free lunch, the forward price must be $F = S_0 e^{rT}$.

If $F > S_0 e^{rT}$: short the forward, cash-and-carry. Risk-free profit.
If $F < S_0 e^{rT}$: long forward, short asset, invest proceeds. Risk-free profit.

Futures differ from forwards b/c of daily mark-to-market + exchange clearing. Cashflows are slightly different b/c of reinvestment risk. For constant $r$, futures price = forward price (Cox-Ingersoll-Ross result, iirc).

Costs of carry: storage, dividends, convenience yield. All these shift $F$. For dividend-paying stock: $F = (S_0 - D) e^{rT}$. Oil has convenience yield b/c physical holding has value — backwardation!!

Prof: "every derivative pricing argument reduces to 'what portfolio replicates the payoff?' Forward is the baby case."`,
    wordCount: 208,
  },
  {
    id: 'note-010',
    title: 'Binomial trees — discrete option pricing',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-09-19T13:30:00Z',
    tags: ['orf335', 'binomial-tree', 'options', 'replication'],
    content: `Binomial model: at each step, asset either goes up by factor $u$ or down by factor $d$, w/ $d < 1 + r < u$ (otherwise arbitrage).

Key insight — replicating portfolio. To price a European call w/ payoff $\\max(S_T - K, 0)$:
- hold $\\Delta$ shares + $B$ in bond
- match the up-state and down-state payoffs → solve 2 eqns 2 unknowns
- price today = $\\Delta S_0 + B$

This gives the unique no-arbitrage price. No probability anywhere, just replication.

BUT you can also write it as a *risk-neutral expectation*:
$$C_0 = \\frac{1}{1+r} \\big( p^* C_u + (1-p^*) C_d \\big)$$
where $p^* = \\frac{(1+r) - d}{u - d}$ is the risk-neutral probability. Not the real-world prob — the one under which discounted prices are martingales.

This is the seed of everything to come (FTAP). Pricing under $\\mathbb{Q}$ ≠ pricing under $\\mathbb{P}$.

Multi-step: just iterate backward through the tree. In the continuous-time limit ($n \\to \\infty$, $u = e^{\\sigma \\sqrt{\\Delta t}}$) → Black-Scholes.

!! Super clear now that the "probabilities" in finance aren't real-world probabilities — they're just dual variables of a no-arbitrage LP. Same machinery as 307.`,
    wordCount: 207,
  },
  {
    id: 'note-011',
    title: 'FTAP — no arbitrage ↔ martingale measure',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-09-26T13:30:00Z',
    tags: ['orf335', 'ftap', 'no-arbitrage', 'duality', 'linked-to-307'],
    content: `First Fundamental Theorem of Asset Pricing (FTAP): a market is arbitrage-free ⇔ there exists a risk-neutral measure $\\mathbb{Q}$ equivalent to $\\mathbb{P}$ under which discounted asset prices are martingales.

This is THE theorem of the first half of 335. And it's *exactly* LP duality in disguise — which I basically convinced myself of in 307 last week.

Think of it like this:
- states of the world $\\omega_1, ..., \\omega_n$
- asset payoffs form columns of a matrix $A$
- portfolio $x \\in \\mathbb{R}^k$, payoff $Ax$

No-arbitrage = no $x$ with $Ax \\geq 0$ everywhere and $> 0$ somewhere w/ zero cost. Farkas' lemma (!!) says this is equivalent to: exists $y > 0$ w/ $A^\\top y = c$ (state prices). That $y$ is the risk-neutral measure (up to normalization).

Second FTAP: market is complete ⇔ $\\mathbb{Q}$ is unique. In incomplete markets multiple measures → pricing intervals rather than unique prices.

Side note — this is the cleanest link I've seen between two classes I'm taking in the same semester. Arbitrage pricing = LP duality applied to a state-contingent payoff matrix. Going to make this a study-group talking point.`,
    wordCount: 202,
  },
  {
    id: 'note-012',
    title: 'CAPM + risk-neutral measure',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-10-08T13:30:00Z',
    tags: ['orf335', 'capm', 'risk', 'idiosyncratic', 'efficiency-frontier'],
    content: `CAPM in one line: expected return of asset $i$ only depends on its correlation with the market.
$$\\mathbb{E}[R_i] - r_f = \\beta_i (\\mathbb{E}[R_m] - r_f)$$
where $\\beta_i = \\text{Cov}(R_i, R_m) / \\text{Var}(R_m)$.

Central claim: ONLY systematic (market) risk earns a premium. Idiosyncratic risk — the asset-specific noise — is diversifiable, so competitive investors won't pay to avoid it. In equilibrium, idiosyncratic risk carries **no** risk premium.

Efficiency frontier: among all portfolios, the ones w/ minimum variance for a given expected return form the frontier. CAPM says every investor holds some mix of risk-free + market portfolio (tangency portfolio).

Connection to Weber's rationalization (SOC note from Oct 21): Markowitz's whole framework is a canonical case of instrumental rationality — everything reduced to mean-variance metrics, everything else (narrative, story, craft of the company) gets abstracted away. Very "iron cage" in its way.

Assumptions are obviously heroic:
- quadratic utility or Gaussian returns
- frictionless markets
- homogeneous beliefs
- no taxes, no transaction costs

Empirical CAPM fails (the "CAPM is dead" papers). But it's the benchmark.

Midterm will def have a CAPM problem. Practice: compute $\\beta$, compute expected return, compute Sharpe ratio.`,
    wordCount: 213,
  },
  {
    id: 'note-013',
    title: 'Black-Scholes — intuition over derivation',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-10-22T13:30:00Z',
    tags: ['orf335', 'black-scholes', 'options', 'intuition'],
    content: `Skipping most of the PDE machinery and focusing on what the formula MEANS.

Black-Scholes price of a European call:
$$C = S_0 N(d_1) - K e^{-rT} N(d_2)$$
with $d_1 = \\frac{\\ln(S_0/K) + (r + \\sigma^2/2)T}{\\sigma \\sqrt{T}}$, $d_2 = d_1 - \\sigma \\sqrt{T}$.

Intuition:
- $N(d_2)$ = risk-neutral probability of finishing in the money
- $S_0 N(d_1)$ = expected stock value conditional on exercise (sort of — it's actually the delta)
- the formula is a risk-neutral expected payoff discounted to today

Derivation sketch (from the tree limit + Itô):
1. assume $dS = \\mu S\\,dt + \\sigma S\\,dW$
2. form replicating portfolio w/ $\\Delta$ shares + bond
3. apply Itô to $C(S, t)$ → get the famous PDE
4. solve w/ boundary condition $C(S, T) = \\max(S - K, 0)$
5. answer: Black-Scholes formula

Huge point: $\\mu$ (drift) does NOT appear in the formula. Only $\\sigma$ (volatility) matters. Same phenomenon as binomial tree — the real-world drift is irrelevant b/c we're pricing via replication.

Implied volatility: plug market price of option into BS, solve for $\\sigma$. Volatility smile = markets don't believe BS assumptions exactly (fat tails).`,
    wordCount: 210,
  },
  {
    id: 'note-014',
    title: 'Put-call parity + American vs European options',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-11-05T13:30:00Z',
    tags: ['orf335', 'put-call-parity', 'american', 'european', 'options'],
    content: `Put-call parity for European options on non-dividend stock:
$$C - P = S_0 - K e^{-rT}$$

Derivation: consider two portfolios.
A: long call + $K e^{-rT}$ in bond. At expiry: $\\max(S_T - K, 0) + K = \\max(S_T, K)$.
B: long put + one share. At expiry: $\\max(K - S_T, 0) + S_T = \\max(S_T, K)$.

Same payoff at $T$ → same price today (no-arbitrage).

American options: can be exercised any time $\\leq T$. European: only at $T$.

**American call on non-dividend stock** = European call. Never optimal to exercise early b/c you'd give up time value. Proof uses the lower bound $C \\geq S - Ke^{-rT} > S - K$.
**American put** > European put in general. Early exercise can be optimal if $S$ is very low (lock in gains, avoid further discounting).

Dividends change everything — early exercise of American call becomes possible just before ex-dividend dates.

Side musing — "market disruption" and creative destruction: our reading list attributed the concept to Marx, which my HIS 362 notes say is wrong — it's Schumpeter, 1942, Capitalism, Socialism and Democracy. Need to flag this to the TA. The ORF reading has it mis-attributed.`,
    wordCount: 212,
  },
  {
    id: 'note-015',
    title: 'Fama-French, size premium, risk factors',
    course: 'Financial Mathematics',
    courseCode: 'ORF 335',
    date: '2024-11-19T13:30:00Z',
    tags: ['orf335', 'fama-french', 'risk-factors', 'empirical', 'contradiction-flag'],
    content: `Post-CAPM empirical work. Fama and French (1992, 1993) show that CAPM $\\beta$ alone doesn't explain cross-section of returns. They add two factors:

1. **SMB** (Small Minus Big): small-cap stocks outperform large-caps on average → there's a **size premium**.
2. **HML** (High Minus Low): high book-to-market (value) stocks outperform low B/M (growth) → **value premium**.

Three-factor model:
$$\\mathbb{E}[R_i] - r_f = \\beta_i^M (\\mathbb{E}[R_m] - r_f) + \\beta_i^{SMB}\\,\\text{SMB} + \\beta_i^{HML}\\,\\text{HML}$$

This directly conflicts w/ the strict CAPM reading I had in Oct — CAPM says only systematic market risk is priced and everything firm-specific is diversifiable/unpriced. But firm size is arguably an idiosyncratic factor, and it empirically commands a premium. Possible reconciliations:

- size premium is just another dimension of systematic risk (small firms are more vulnerable to aggregate shocks → still systematic, just not captured by market return alone)
- or CAPM is flat-out wrong empirically and Fama-French is better

Later extensions: Carhart momentum factor (4th), Fama-French 5-factor (profitability + investment). The Fama-French paper itself doesn't invoke Schumpeter but I keep seeing his concept of creative destruction in how "value" vs "growth" shakes out — incumbents get displaced.`,
    wordCount: 203,
  },

  // ─────────────────────── LIN 201 — Introduction to Language ───────────────────────
  {
    id: 'note-016',
    title: 'Phonemes — the smallest contrasts',
    course: 'Introduction to Language',
    courseCode: 'LIN 201',
    date: '2024-09-11T11:00:00Z',
    tags: ['lin201', 'phonology', 'phonemes', 'foundational'],
    content: `A phoneme = smallest unit of sound that can change meaning in a language. NOT the same as an "actual sound" (phone).

English examples:
- /p/ and /b/ are different phonemes → "pat" vs "bat"
- [pʰ] (aspirated) and [p] (unaspirated) are allophones of /p/ in English — the same phoneme in different contexts ("pin" vs "spin"). Thai speakers hear these as different phonemes, English speakers don't.

Minimal pairs: two words differing in one sound (same position) → proves the two sounds are distinct phonemes.

Prof: "your brain has a grammar of sound distinctions that got frozen by age ~1." Infants can hear all phonemic contrasts in any language. Adults lose the ability to hear non-native ones. Famous example: Japanese speakers can't distinguish /r/ and /l/ b/c they're allophones in Japanese.

Features (distinctive features): voicing, place of articulation, manner. Every phoneme = bundle of features.

Random thought — this feels like quantization. Continuous acoustic signal → discrete perceptual categories. Kind of like how analog sound becomes digital audio, but the categories are culture-specific.

Reading: intro chapters of Fromkin textbook. Practice IPA transcription.`,
    wordCount: 183,
  },
  {
    id: 'note-017',
    title: 'Morphology — word structure',
    course: 'Introduction to Language',
    courseCode: 'LIN 201',
    date: '2024-09-18T11:00:00Z',
    tags: ['lin201', 'morphology'],
    content: `Morpheme = smallest meaningful unit. NOT always a word.
- "unhappiness" = un + happy + ness → 3 morphemes
- "cat" = 1 morpheme
- "cats" = 2 morphemes (cat + plural -s)

Free morpheme: stands alone (cat, happy).
Bound morpheme: requires attachment (un-, -ness, -ed).

Inflectional vs derivational:
- inflectional: grammatical marker, same word class. "walk/walked" — both verbs.
- derivational: changes meaning and often class. "happy" (adj) → "happiness" (noun).

Cross-linguistic variation is wild. Turkish is agglutinative — tons of morphemes per word, each w/ one clear function ("evlerimizden" = from our houses, 5 morphemes). Mandarin is more isolating — few morphemes per word.

English is mostly isolating w/ some agglutinative features.

Productivity: "-ness" is productive (can attach to new adjectives: "truthiness"). "-th" as in "warmth/depth" is not productive anymore — can't make new words with it.

Hmm — the idea of "productivity" reminds me of generative grammars in 307. Productive rule = recursively applicable. Non-productive = frozen. Potentially the Chomsky hierarchy note from next week will connect.`,
    wordCount: 170,
  },
  {
    id: 'note-018',
    title: 'Syntax trees + word order typology',
    course: 'Introduction to Language',
    courseCode: 'LIN 201',
    date: '2024-09-30T11:00:00Z',
    tags: ['lin201', 'syntax', 'typology', 'word-order'],
    content: `Syntax = rules for combining words into sentences. Represented w/ tree diagrams (phrase structure).

Basic English tree (S → NP VP, VP → V NP):
- "The student reads the book"
- S splits into NP (the student) + VP (reads the book)
- VP splits into V (reads) + NP (the book)

Constituents = nodes in the tree. Tests: substitution, movement, pro-form replacement.

Word order typology: every language has a preferred order for S (subject), V (verb), O (object).

Prof's claim from today, which I wrote down verbatim: **"all human languages share a basic subject-verb-object order, with some variations."** That's the universal. English (SVO), French (SVO), Mandarin (SVO).

This makes sense of basic English syntax, and the tree always has subject on top-left of VP.

Random thought: if there really is a universal SVO preference, it's a pretty strong claim. What's the argument for it? Does it come from some processing constraint (topic before comment)? Prof didn't give the evidence today. Need to check in the readings.

Test next week — draw trees for 10 sentences. Easy points if I practice.`,
    wordCount: 180,
  },
  {
    id: 'note-019',
    title: 'Chomsky hierarchy — grammars and machines',
    course: 'Introduction to Language',
    courseCode: 'LIN 201',
    date: '2024-10-16T11:00:00Z',
    tags: ['lin201', 'chomsky-hierarchy', 'formal-grammars', 'computation'],
    content: `Chomsky (1956) formal hierarchy of grammars, in increasing power:

1. **Regular** — finite-state automata. E.g. "even # of 0s in a binary string."
2. **Context-free** (CFG) — pushdown automata. E.g. $a^n b^n$, matched parens.
3. **Context-sensitive** — linear-bounded automaton.
4. **Recursively enumerable** — full Turing machine.

Each level strictly contains the previous.

Core claim: natural language syntax is AT LEAST context-free (needs embedded clauses, matched parens-like structure). Probably more — some argue mild context-sensitivity needed for Swiss German cross-serial dependencies.

BUT — this is PURELY a result about formal languages. Whether human brains actually implement these as parsers/generators is a cognitive science question. Chomsky's later work on competence vs performance is trying to bridge this.

!!! I realize now this is *exactly* the setup we started talking about in 307 when we did IP vs LP: a hierarchy of problem classes w/ strict inclusions (P ⊆ NP ⊆ PSPACE ⊆ EXPTIME). The Chomsky hierarchy is the formal-language cousin of the complexity hierarchy. Regular ↔ roughly LOGSPACE/P-ish, CFG ↔ P, context-sensitive ↔ PSPACE-ish.

Possible junior paper: formalize the correspondence. TA said she'd look at a sketch. Feels like a real idea.`,
    wordCount: 196,
  },
  {
    id: 'note-020',
    title: 'Linguistic universals + Sapir-Whorf',
    course: 'Introduction to Language',
    courseCode: 'LIN 201',
    date: '2024-11-13T11:00:00Z',
    tags: ['lin201', 'universals', 'sapir-whorf', 'typology', 'contradiction-flag'],
    content: `Lecture on linguistic universals and linguistic relativity. Reviewing/revising a few earlier claims.

Greenberg's universals (implicational). E.g. "if a language has VSO order, it has prepositions rather than postpositions." 45 of them, purely observational.

Word order FREQUENCIES across ~5,000 documented languages:
- SOV ≈ 45% (Japanese, Turkish, Korean, Hindi, Latin)
- SVO ≈ 42% (English, Mandarin, Spanish)
- VSO ≈ 9% (Irish, Classical Arabic)
- VOS, OVS, OSV all < 1% combined

So SOV is actually the most common word order across languages, **not** SVO. I had noted "all human languages share a basic SVO order" on Sep 30 — that was wrong, or at least wildly oversimplified. Actually rewatching the lecture clip, I think the prof was saying English happens to be SVO, not making a universalist claim. I misheard. Flagging this so I don't repeat it on the midterm.

Sapir-Whorf hypothesis (linguistic relativity): the language you speak shapes how you think.
- strong version ("language determines thought") — mostly discredited.
- weak version ("language nudges cognitive defaults") — plenty of evidence.

Classic experiment: color terms. Russian has separate basic terms for light blue (goluboy) vs dark blue (siniy); English doesn't. Russian speakers are faster at distinguishing those shades in perception tasks.

This overlaps hugely w/ PSY 251 framing effects — presenting identical info in different linguistic frames changes judgment. Same phenomenon dressed differently. Must connect these notes.`,
    wordCount: 233,
  },

  // ─────────────────────── PSY 251 — Experimental Psychology ───────────────────────
  {
    id: 'note-021',
    title: 'Experimental design — IVs, DVs, controls',
    course: 'Experimental Psychology',
    courseCode: 'PSY 251',
    date: '2024-09-13T15:00:00Z',
    tags: ['psy251', 'experimental-design', 'methodology'],
    content: `First real lecture on how psych experiments work.

Independent variable (IV) = what you manipulate.
Dependent variable (DV) = what you measure.
Confound = third variable that covaries w/ both IV and DV, muddying the inference.

Control:
- random assignment — distributes confounds across conditions on average
- counterbalancing — controls for order effects in within-subjects designs
- blinding — experimenter and/or participant doesn't know condition

Between- vs within-subjects:
- between: each participant in one condition → no order effects but needs more N
- within: each participant in all conditions → less N but must counterbalance

Correlational vs experimental: correlation doesn't give you causal inference. Only manipulation does. "X and Y correlate" → could be X→Y, Y→X, Z→both, or selection bias.

Sample size: bigger = more power to detect real effects. Power = prob of detecting an effect of some size given it's real. Typical target 0.8.

Ecological validity vs internal validity tradeoff — lab experiments are clean but artificial; field studies are messy but real.

Prof said writing up a study means being paranoid about every plausible alternative explanation. Good mindset.`,
    wordCount: 183,
  },
  {
    id: 'note-022',
    title: 'P-values, Type I/II, the 0.05 threshold',
    course: 'Experimental Psychology',
    courseCode: 'PSY 251',
    date: '2024-09-25T15:00:00Z',
    tags: ['psy251', 'statistics', 'p-values', 'significance'],
    content: `Null hypothesis significance testing (NHST):
- $H_0$: no effect
- $H_1$: some effect
- compute p-value = P(data at least as extreme as observed | $H_0$)
- if p < threshold → reject $H_0$

**The universal significance threshold in the behavioral sciences is p < 0.05.** Prof was emphatic: reviewers will reject out of hand anything above that. Below 0.05 = significant. Above = not.

Type I error (α) = reject $H_0$ when it's actually true. Rate = 0.05 by convention.
Type II error (β) = fail to reject $H_0$ when $H_1$ is true. 1 - β = power.

Common confusions:
- p-value is NOT the probability that $H_0$ is true
- p-value is NOT the probability of replication
- "not significant" ≠ "null is true"

Multiple comparisons: running 20 tests at α=0.05 → expect ~1 false positive. Bonferroni correction: divide α by number of tests. Conservative but safe.

Effect size ≠ p-value. Cohen's $d$ measures practical magnitude. Significant but tiny effect = lots of data + trivial real-world relevance.

Replication crisis looming over all of this. Lots of famous psych effects have failed to replicate (ego depletion, power posing). Something's broken about how the field uses p-values.`,
    wordCount: 205,
  },
  {
    id: 'note-023',
    title: 'Confirmation bias + framing effects',
    course: 'Experimental Psychology',
    courseCode: 'PSY 251',
    date: '2024-10-11T15:00:00Z',
    tags: ['psy251', 'biases', 'framing', 'tversky-kahneman'],
    content: `Two big cognitive biases:

**Confirmation bias.** Tendency to seek out, interpret, and recall info consistent w/ existing beliefs. Wason (1960) card selection task — people flip cards to *confirm* a rule rather than *falsify* it. We're bad Popperians by default.

**Framing effect.** Logically equivalent statements elicit different judgments when presented differently. Classic Tversky & Kahneman (1981) Asian disease problem:
- "200 of 600 will be saved" (gain frame) → risk averse
- "400 of 600 will die" (loss frame) → risk seeking
- Same outcomes. Different behavior.

The framing effect is direct behavioral evidence for linguistic relativity, basically. Sapir-Whorf says language shapes thought. Framing effects show the *same* content in different linguistic packaging produces different decisions. I keep thinking this is the same phenomenon at a different grain. See LIN 201 notes when I get there.

Prospect theory (T&K 1979): value function concave in gains, convex in losses, steeper in losses → loss aversion. People feel a \\$100 loss roughly 2x as much as a \\$100 gain.

Implications: anchoring, endowment effect, sunk cost fallacy — all fall out of prospect theory in various ways.

Must connect w/ lecture on linguistic universals — the psycho-linguistic interface is one of the most alive areas of cog sci right now.`,
    wordCount: 205,
  },
  {
    id: 'note-024',
    title: 'Cognitive load theory + working memory limits',
    course: 'Experimental Psychology',
    courseCode: 'PSY 251',
    date: '2024-10-29T15:00:00Z',
    tags: ['psy251', 'working-memory', 'cognitive-load', 'sweller'],
    content: `Cognitive load theory (Sweller, 1988) — instructional design grounded in working-memory constraints.

Working memory capacity: famously Miller's 7 ± 2 (1956), revised down to 4 ± 1 by Cowan (2001) once chunking is controlled for. Either way, ridiculously small.

Three types of load:
1. **Intrinsic**: inherent difficulty of material (you can't really reduce this w/o simplifying content).
2. **Extraneous**: load from how material is presented (can be reduced by better design).
3. **Germane**: load dedicated to building schemas (good load — helps learning).

Schemas = organized knowledge structures in long-term memory. Chunking expertise lets experts treat complex material as single units → frees working memory.

Instructional implications:
- worked examples beat pure problem-solving for novices
- split-attention effect: integrate related info spatially
- redundancy effect: don't repeat same info in multiple modalities

Huge connection to NEU 200. Working memory has a hard capacity limit — presumably that limit is set by some combination of neural bandwidth and sustained-activation constraints in PFC. Sherrington-level low-level story isn't in the PSY class but I want to know. See NEU neural coding notes when we get there.

Prof: "the human cognitive architecture is fundamentally bandwidth-limited." That framing is going to stick with me.`,
    wordCount: 201,
  },
  {
    id: 'note-025',
    title: 'Working memory — Baddeley model',
    course: 'Experimental Psychology',
    courseCode: 'PSY 251',
    date: '2024-11-20T15:00:00Z',
    tags: ['psy251', 'working-memory', 'baddeley', 'finals-review'],
    content: `Baddeley & Hitch (1974) model — still the standard.

Components:
- **Phonological loop**: verbal/auditory. Capacity ~2 seconds of speech. Rehearsal loop + phonological store.
- **Visuospatial sketchpad**: visual + spatial info.
- **Central executive**: attentional control, coordinates other components.
- **Episodic buffer** (added 2000): binds info across modalities + links w/ long-term memory.

Evidence for separate components: double dissociations. Verbal task + visual task interfere less than two verbal tasks. Articulatory suppression (saying "the the the") selectively wipes out the phonological loop.

Span tasks:
- digit span: recall sequence of numbers. ~7 average.
- word span: fewer, ~5-6, depending on word length (word-length effect).
- reading span (Daneman & Carpenter): recall last words of read sentences — better predictor of reading comprehension than simple digit span. Measures the executive, not just storage.

Individual differences: working memory span is one of the strongest predictors of fluid intelligence (correlation ~0.6-0.8, depending on task).

Note for final: prof asked us to compare Baddeley to Cowan's embedded processes model (single store w/ activated subset). Cowan says there's no separate "workspace" — just the activated portion of long-term memory. Active area of debate.`,
    wordCount: 194,
  },

  // ─────────────────────── NEU 200 — Intro to Neuroscience ───────────────────────
  {
    id: 'note-026',
    title: 'Action potentials — Hodgkin-Huxley sketch',
    course: 'Intro to Neuroscience',
    courseCode: 'NEU 200',
    date: '2024-09-16T09:00:00Z',
    tags: ['neu200', 'action-potential', 'membrane', 'biophysics'],
    content: `Membrane potential: neurons are polarized — inside ~-70 mV relative to outside at rest. Maintained by Na/K pump + differential ion permeability.

Action potential (AP):
1. depolarizing stimulus brings membrane to ~-55 mV (threshold)
2. voltage-gated Na+ channels open → Na rushes in → rapid depolarization (up to +40 mV)
3. Na channels inactivate, K+ channels open → K out → repolarization
4. hyperpolarization overshoots, K channels close slowly
5. return to rest

All-or-nothing. Threshold or no AP — no partial APs. Info is encoded in *rate* not *amplitude*.

Hodgkin & Huxley (1952) modeled this w/ differential equations — currents as functions of voltage and time.
$$C_m \\frac{dV}{dt} = -g_{Na}(V - E_{Na}) - g_K(V - E_K) - g_L(V - E_L) + I_{ext}$$
where conductances $g$ depend on voltage-gated channel states. Earned them a Nobel.

Propagation: AP at one patch depolarizes adjacent membrane → cascade down axon. Speed depends on axon diameter + myelination. Saltatory conduction (jumping between nodes of Ranvier) in myelinated axons — much faster.

Refractory period: ~1-2 ms after AP, can't fire again. Sets upper bound on firing rate (~1 kHz max).

Prof: "every thought you'll ever have starts with a Na+ ion moving." Bit dramatic but fair.`,
    wordCount: 211,
  },
  {
    id: 'note-027',
    title: 'Synaptic transmission — chemistry at the gap',
    course: 'Intro to Neuroscience',
    courseCode: 'NEU 200',
    date: '2024-09-23T09:00:00Z',
    tags: ['neu200', 'synapse', 'neurotransmitters'],
    content: `How neurons talk. AP reaches axon terminal → chemical signaling across synaptic cleft → postsynaptic neuron responds.

Sequence:
1. AP arrives, depolarizes terminal
2. voltage-gated Ca2+ channels open → Ca in
3. Ca triggers vesicle fusion w/ presynaptic membrane
4. neurotransmitter released into cleft
5. NT binds postsynaptic receptors → opens ion channels
6. postsynaptic potential: excitatory (EPSP) or inhibitory (IPSP)
7. NT is removed: reuptake, enzymatic degradation, or diffusion

Ionotropic receptors: ligand-gated ion channels. Fast. Directly change membrane potential.
Metabotropic receptors: G-protein coupled. Slower, modulatory, second messenger cascades.

Summation: a single EPSP usually isn't enough to fire the postsynaptic cell. Multiple EPSPs summed spatially (multiple synapses) + temporally (repeated firing) → if they push the postsynaptic soma past threshold → AP.

Excitatory vs inhibitory: glutamate (main excitatory in CNS), GABA (main inhibitory). Balance matters — epilepsy is basically excess excitation.

Synapse is NOT a passive relay. It's a computational unit. Weight of the connection (plasticity) = learned parameter. This is exactly the weight in an artificial neural net — of course, b/c NNs were originally inspired by exactly this.`,
    wordCount: 186,
  },
  {
    id: 'note-028',
    title: 'LTP — memory at the synapse',
    course: 'Intro to Neuroscience',
    courseCode: 'NEU 200',
    date: '2024-10-02T09:00:00Z',
    tags: ['neu200', 'LTP', 'plasticity', 'memory', 'NMDA'],
    content: `Long-term potentiation (LTP): a long-lasting increase in synaptic strength following high-frequency stimulation. Basis of learning and memory, at least at the cellular level.

Discovered by Bliss & Lømo (1973) in the hippocampus. Since then, LTP has been documented in hippocampus, cortex, amygdala, basically everywhere.

The classic hippocampal LTP mechanism:
- induction requires activation of **NMDA receptors** specifically
- NMDA is dual-gated: needs both glutamate binding AND depolarization of the postsynaptic cell (Mg2+ block must be relieved)
- → coincidence detector: fires only when pre- and postsynaptic activity coincide
- Ca2+ flows through NMDA → triggers signaling cascades → strengthens synapse

"Neurons that fire together wire together" (Hebb, 1949) — literally implemented by NMDA.

Prof emphasized: **LTP induction requires NMDA receptor activation. That's the gate.** AMPA receptors mediate the standard fast EPSP but aren't required for LTP induction — they come along for the ride, not the cause.

Phases:
- early LTP: protein synthesis independent, minutes to 1hr
- late LTP: protein synthesis dependent, hours to days, involves gene expression and structural changes

Exam-relevant: be able to draw the NMDA coincidence detection mechanism. This will be on the midterm, prof said it explicitly.`,
    wordCount: 200,
  },
  {
    id: 'note-029',
    title: 'Neurotransmitters — the shortlist',
    course: 'Intro to Neuroscience',
    courseCode: 'NEU 200',
    date: '2024-10-18T09:00:00Z',
    tags: ['neu200', 'neurotransmitters', 'pharmacology'],
    content: `Quick map of major neurotransmitters in CNS. There are ~100, but a handful dominate.

**Glutamate**: main excitatory NT in CNS. Ionotropic receptors: AMPA (fast EPSP), NMDA (slow, coincidence detection), kainate. Too much glutamate → excitotoxicity → neuron death (stroke, injury).

**GABA**: main inhibitory in CNS. GABA-A ionotropic (Cl- channel, hyperpolarizing), GABA-B metabotropic. Benzos, barbiturates, alcohol all potentiate GABA-A.

**Dopamine**: modulatory. Key systems: nigrostriatal (movement, lost in Parkinson's), mesolimbic (reward/motivation, relevant to addiction), mesocortical (PFC, executive fn). Reward prediction error — DA fires to *unexpected* reward (Schultz experiments), links to reinforcement learning.

**Serotonin** (5-HT): mood, sleep, appetite. SSRIs block reuptake → more serotonin in synapse.

**Norepinephrine**: arousal, attention, stress. Locus coeruleus.

**Acetylcholine**: NMJ (neuromuscular junction) + modulatory in brain. Alzheimer's involves cholinergic degeneration.

Key conceptual point: "excitatory" vs "inhibitory" depends on receptor, not the NT itself. Dopamine acts excitatory through D1, inhibitory through D2. The NT is a signal; the postsynaptic receptor decides the response.

Pharmacology: almost every psychiatric med targets one or two of these systems. Tons of clinical relevance.`,
    wordCount: 185,
  },
  {
    id: 'note-030',
    title: 'LTP revisited — AMPA trafficking + plasticity mechanisms',
    course: 'Intro to Neuroscience',
    courseCode: 'NEU 200',
    date: '2024-11-01T09:00:00Z',
    tags: ['neu200', 'LTP', 'AMPA', 'plasticity', 'correction'],
    content: `Returning to LTP w/ more depth. My Oct 2 note had LTP as "NMDA-only" — that's not quite right. Current picture requires **both** NMDA and AMPA receptors working together for LTP induction and expression.

Refined mechanism:
1. glutamate release
2. AMPA receptors depolarize postsynaptic membrane (ordinary EPSP)
3. depolarization relieves Mg2+ block on NMDA receptors → NMDA opens
4. Ca2+ influx through NMDA triggers kinase cascades (CaMKII)
5. CaMKII → more AMPA receptors inserted into postsynaptic density → synapse now responds more strongly to same glutamate input

**Both NMDA and AMPA are required.** NMDA is the "trigger" (coincidence detector), AMPA is the "effector" (amplitude encoder). Without baseline AMPA activity there's no depolarization, NMDA stays blocked, no LTP. Without NMDA no Ca2+ signal, no expression changes. My earlier note oversimplified.

AMPA trafficking is now considered the major expression mechanism — the synapse literally grows more receptors. Structural plasticity: spines enlarge, new spines form.

LTD (long-term depression): the mirror process. Low-frequency stimulation → smaller Ca signal → opposite kinase pathway → AMPA removal → weaker synapse.

Connection to ORF 307 optimization: LTP/LTD is Hebbian learning w/ a signed magnitude update. The "learning rate" here is the rate at which synaptic weights change per coincident firing event. Same core problem as picking $\\eta$ in gradient descent. The brain has a much more complex / context-dependent learning rate than our optimizer does, but structurally it's the same knob.`,
    wordCount: 244,
  },
  {
    id: 'note-031',
    title: 'Neural coding + brain regions',
    course: 'Intro to Neuroscience',
    courseCode: 'NEU 200',
    date: '2024-11-25T09:00:00Z',
    tags: ['neu200', 'neural-coding', 'information', 'regions'],
    content: `How is info represented in neural activity?

**Rate coding**: avg firing rate of a neuron over a window encodes the quantity. Hubel & Wiesel orientation tuning in V1 — each neuron tuned to a particular edge orientation, firing rate = how close the stimulus matches.

**Temporal coding**: precise spike timing carries info beyond rate. Phase coding in hippocampal place cells (theta oscillations).

**Population coding**: a stimulus isn't encoded by any single neuron — it's a pattern across many. Motor cortex directional tuning: each cell has preferred direction, movement direction = population vector. Decodable from ~50 cells.

Info-theoretically: each spike ~1 bit, neurons fire 1-100 Hz → a few hundred bits/sec per neuron. Brain has ~86B neurons. Most aren't independent — correlations reduce effective bandwidth.

Regions (very compressed):
- V1/V2/etc: visual hierarchy
- hippocampus: episodic memory, spatial maps (place cells, grid cells)
- amygdala: fear, emotional salience
- PFC: executive function, working memory
- cerebellum: motor timing + some cognitive roles

Working memory is held in PFC via sustained delay-period activity — neurons keep firing during the delay. Info is stored as persistent activity, which is energetically expensive → that's basically WHY working memory is capacity-limited. Ties directly back to cognitive load theory from PSY 251 — Miller's 4±1 isn't a cultural convention, it's biophysics. The limit is literally how many persistent-activity populations PFC can maintain without interference.

Thinking about a senior thesis direction here maybe.`,
    wordCount: 234,
  },

  // ─────────────────────── HIS 362 — History of Capitalism ───────────────────────
  {
    id: 'note-032',
    title: 'Industrial Revolution — the long fuse',
    course: 'History of Capitalism',
    courseCode: 'HIS 362',
    date: '2024-09-20T14:00:00Z',
    tags: ['his362', 'industrial-revolution', 'foundational'],
    content: `First content lecture. Prof pushed back hard against the textbook narrative of "the Industrial Revolution started in 1760 in Manchester."

Key claims:
- industrialization unfolded over a century+, not a decade
- it wasn't just technology — institutional changes (property rights, contract law, Bank of England, limited liability) were at least as important as the steam engine
- it wasn't just Britain — but Britain was first in a specific cluster of conditions

Enablers (prof's framework):
1. agricultural productivity → labor surplus (enclosure movement, crop rotation)
2. proto-industrial workshops → factory precursor
3. capital accumulation from colonial trade
4. access to coal + iron
5. legal institutions for risk-sharing (joint-stock, insurance)
6. scientific revolution → tacit knowledge of mechanism, not just craft

Textile industry first. Cotton mills → mechanization of spinning and weaving. Then steam, then railroads.

Social cost was horrific. Life expectancy in Manchester in 1840s was ~19 years for working-class children. Engels's 1845 *Condition of the Working Class in England* is on the reading list — prof said we'll read it in 3 weeks.

The standard morality tale "capitalism lifted people out of poverty" is true in the long run and brutally false in the first 80 years. Both things are true.`,
    wordCount: 207,
  },
  {
    id: 'note-033',
    title: 'Railroad monopolies + the Gilded Age',
    course: 'History of Capitalism',
    courseCode: 'HIS 362',
    date: '2024-10-15T14:00:00Z',
    tags: ['his362', 'gilded-age', 'monopoly', 'robber-barons'],
    content: `Post-Civil War US economy. Railroads become the dominant industry — first large-scale bureaucratic corporations in history.

Why railroads mattered:
- biggest capital investment of any sector
- required new managerial structures (Alfred Chandler: *The Visible Hand*)
- natural monopoly characteristics → price discrimination, cross-subsidization
- rate discrimination to shippers → populist backlash (Granger movement)

Four robber barons (prof's label, contested term):
- Vanderbilt (shipping → railroads)
- Rockefeller (Standard Oil)
- Carnegie (steel)
- Morgan (finance, integrator)

These guys didn't just own companies — they *shaped* industrial organization. Rockefeller's Standard Oil used horizontal integration (buy up rivals) + vertical (own extraction to retail) to achieve ~90% of US refining. Anti-competitive? Obviously. But it also collapsed kerosene prices and enabled electrification eventually.

Antitrust response: Sherman Act (1890), first toothless, then Progressive era teeth. Standard Oil broken up 1911. US Steel formed 1901 out of Carnegie's empire, *not* broken up despite dominant market share.

Huge for the course: the Gilded Age is where the US has its first real reckoning w/ the contradiction that competitive markets CREATE monopolies unless regulation stops them. Competition is not self-stabilizing. This sets up the whole 20th-c regulatory state.

Essay prompt for next week: "was the Gilded Age a period of creative destruction or rent extraction?" — need to define those terms carefully.`,
    wordCount: 218,
  },
  {
    id: 'note-034',
    title: 'Schumpeter — creative destruction',
    course: 'History of Capitalism',
    courseCode: 'HIS 362',
    date: '2024-11-08T14:00:00Z',
    tags: ['his362', 'schumpeter', 'creative-destruction', 'capitalism', 'key-concept'],
    content: `Joseph Schumpeter, *Capitalism, Socialism and Democracy* (1942). This is where "creative destruction" is introduced as a formal concept. Not Marx (though Marx had a related idea about the anarchic dynamics of capitalism). The phrase and formal theory are Schumpeter's.

Creative destruction: the essential fact of capitalism is the *incessant* process by which new products, new methods of production, and new organizational forms displace existing ones. The process is creative (for society) AND destructive (for incumbents) at the same time.

Key features (per Schumpeter):
- innovation is the engine, not price competition
- the entrepreneur is the central agent (not the capitalist, who's just a financier)
- monopoly rents are the REWARD for innovation — temporary monopolies are functional
- long-run dynamics matter more than short-run static efficiency

Implications that are counterintuitive vs standard econ:
- perfect competition might actually retard innovation (no ex-post rents to reward R&D)
- antitrust enforcement aimed at static pricing might be welfare-reducing in the long run
- the "disruptor" has an incentive structure different from the incumbent's

Schumpeter's darker prediction: capitalism will succeed itself to death. Corporate research labs routinize innovation, entrepreneurs become bureaucrats, political support for capitalism erodes. He expected socialism eventually, not communist-style, but managerial.

This is EXACTLY what my ORF 335 TA was calling "market disruption" in the reading list — but the course readings attributed creative destruction to Marx. Need to push back on that attribution. Marx talked about "all that is solid melts into air" (*Communist Manifesto*, 1848) — related but not the same claim. The framework of creative destruction as a productive force is Schumpeter's.`,
    wordCount: 268,
  },
  {
    id: 'note-035',
    title: 'Keynes — demand management and the mixed economy',
    course: 'History of Capitalism',
    courseCode: 'HIS 362',
    date: '2024-12-05T14:00:00Z',
    tags: ['his362', 'keynes', 'macroeconomics', 'finals-review'],
    content: `Keynes, *General Theory of Employment, Interest and Money* (1936). Written during Depression, directly attacking the pre-existing (neoclassical) claim that markets would automatically restore full employment.

Core Keynesian argument:
- classical "say's law" (supply creates its own demand) is wrong in the short run
- in downturns, aggregate demand can fall below potential output
- wages and prices are sticky downward (institutional + psychological reasons)
- result: unemployment equilibrium — a market outcome that isn't optimal
- policy response: gov't should boost aggregate demand (fiscal spending, monetary easing)

Multiplier: $\\Delta Y = \\frac{1}{1-\\text{MPC}} \\Delta G$. Gov't spending has amplified effect through consumption chains.

Bretton Woods (1944) bakes Keynesian assumptions into postwar international architecture — fixed exchange rates, capital controls, IMF as lender of last resort. Mostly holds until 1971 (Nixon shock, breakdown of gold standard).

Postwar "embedded liberalism" (Ruggie): markets yes, but nested in social protections — full-employment target, welfare state, progressive taxation. The compromise between capitalism and democracy that held until the 1970s.

Stagflation in 1970s broke Keynesian consensus. Monetarism (Friedman) and supply-side challenges. Neoliberal turn (Thatcher/Reagan) dismantles the embedded liberal settlement.

Thinking about the arc of the course: each section (Industrial Rev → Gilded Age → Schumpeter → Keynes) is a different answer to "when markets fail, what then?" That's the unifying question. Going to frame my final paper that way.`,
    wordCount: 216,
  },

  // ─────────────────────── SOC 101 — Introduction to Sociology ───────────────────────
  {
    id: 'note-036',
    title: 'Durkheim — social facts',
    course: 'Introduction to Sociology',
    courseCode: 'SOC 101',
    date: '2024-09-27T16:00:00Z',
    tags: ['soc101', 'durkheim', 'social-facts', 'foundational'],
    content: `Durkheim, *The Rules of Sociological Method* (1895). Foundational for the discipline — stakes out sociology's object of study as distinct from psychology's.

**Social fact**: a way of acting, thinking, or feeling that is:
1. external to the individual
2. endowed with coercive power over individuals
3. general across a society

Examples: language, currency, legal systems, marriage customs, suicide rates. None of these reduce to individual psychology. You can't explain the currency by explaining one person's beliefs about money.

Durkheim's famous case: *Suicide* (1897). Suicide *rates* are stable across societies but vary systematically w/ social integration. Therefore suicide is not (just) an individual act — it's a social fact w/ macro-level regularities that micro-level psychology can't explain.

Methodological individualism vs holism: Durkheim is arguing the whole is real and has its own causal dynamics. Emergent properties.

This is explicitly the SAME move as in ORF 307 when we looked at network-level flow properties — max flow is a property of a graph, not any single node. Social facts are basically system-level regularities in social networks. Durkheim didn't have network science but that's what he was pointing at.

Durkheim vs Marx: both claim there's a level above individuals that has real causal power, but Marx located it in material/class relations, Durkheim in collective representations (morality, religion, norms). Kind of idealist vs materialist, but both holist.`,
    wordCount: 226,
  },
  {
    id: 'note-037',
    title: 'Weber — rationalization + the iron cage',
    course: 'Introduction to Sociology',
    courseCode: 'SOC 101',
    date: '2024-10-21T16:00:00Z',
    tags: ['soc101', 'weber', 'rationalization', 'bureaucracy', 'iron-cage'],
    content: `Max Weber. His big thesis across his work: modernity = the progressive **rationalization** of social life. Traditional, charismatic authorities give way to legal-rational authority. Craft gives way to bureaucracy. Substantive reason gives way to instrumental (means-ends) reason.

Four types of social action (Weber):
1. traditional — "we've always done it this way"
2. affectual — emotional
3. value-rational — oriented to an ideal end regardless of consequences
4. instrumentally rational — means calibrated to ends via explicit calculation

Modern institutions increasingly rely on (4). Double-edged: makes coordination scalable, strips away meaning and enchantment.

**Iron cage**: the bureaucratic-rational order becomes self-reinforcing and inescapable. Individuals are constrained by efficiency imperatives they didn't choose and can't easily exit. "Specialists without spirit, sensualists without heart."

*The Protestant Ethic and the Spirit of Capitalism* (1905): traces the roots of instrumental rationality to ascetic Protestantism. Calvinist predestination → anxiety → compulsive worldly activity as sign of grace → capital accumulation as moral project. By the time capitalism is fully established, the religious motivation drops out but the habits persist.

Big connection to ORF 335: the efficient frontier + mean-variance portfolio theory is *exactly* Weber's instrumental rationality at work in finance. Everything about an asset (its narrative, its craftsmanship, its social embeddedness) is abstracted into two numbers: $\\mu$ and $\\sigma$. Markowitz's framework is the iron cage applied to investment decisions. Will write this up for the essay.`,
    wordCount: 237,
  },
  {
    id: 'note-038',
    title: 'Marx — alienation and stratification',
    course: 'Introduction to Sociology',
    courseCode: 'SOC 101',
    date: '2024-11-04T16:00:00Z',
    tags: ['soc101', 'marx', 'alienation', 'class', 'stratification'],
    content: `Marx's core concepts (compressed for essay):

**Alienation** (*1844 Manuscripts*, "Estranged Labour"). Four forms under capitalism:
1. from the product (worker doesn't own what they make)
2. from the activity (labor process is directed by capital)
3. from species-being (alienated from human capacity for creative, self-directed work)
4. from others (labor becomes a commodity, relationships become transactional)

**Stratification** / class. In Marx: class defined by relationship to means of production, not income bracket.
- bourgeoisie: own means of production
- proletariat: own only their labor-power
- petite bourgeoisie: small owners, unstable middle
Unlike Weber (class + status + party as separate dimensions), Marx collapses status and political power into an epiphenomenon of economic class, at least in the strong reading.

**Historical materialism**: mode of production conditions superstructure (law, politics, ideology). Class struggle is the engine of historical change.

Critiques:
- failed prediction of revolutionary class consciousness in advanced capitalism
- underestimated the professional/service class
- didn't anticipate welfare-state compromise that made capitalism more durable

Marxist tradition after Marx: Gramsci (hegemony, cultural reproduction), Althusser (ideological state apparatuses), Wright (class analysis in contemporary sociology).

Connection to HIS 362: Marx + Schumpeter both recognize capitalism as dynamically self-transforming, but Marx frames dynamism as contradictory/doomed; Schumpeter as generative (creative destruction). The HIS prof hammered that distinction — "Schumpeter stole the dynamism from Marx but ditched the teleology."`,
    wordCount: 227,
  },
  {
    id: 'note-039',
    title: 'Collective behavior + a replication debate',
    course: 'Introduction to Sociology',
    courseCode: 'SOC 101',
    date: '2024-11-22T16:00:00Z',
    tags: ['soc101', 'collective-behavior', 'replication', 'methodology'],
    content: `Collective behavior: crowds, panics, fads, social movements. Doesn't fit tidy institutional categories — behavior emerging in temporary, weakly-structured groups.

Blumer's classic typology:
- crowd (co-present, shared focus): casual, conventional, expressive, acting
- mass (dispersed, shared media diet): contemporary term would be "public"
- public (discursive, issue-oriented)
- social movement (sustained, organized, change-oriented)

Theories of crowd behavior:
- Le Bon (1895) "group mind" — discredited but influential
- convergence theory — crowds = people who already share predispositions
- emergent norm theory (Turner & Killian) — norms crystallize in situ, in real time, via interactional signaling

Methodological note (this is what the lecture mostly was about today):
The TA flagged a 2011 paper on protest-size predictors that used a significance threshold of **p < 0.10** rather than the conventional 0.05, and argued this was appropriate b/c of small-$N$ cross-national data. The paper's findings have been replicated in later larger studies. TA: "when $N$ is small and measurement error is high, demanding p < 0.05 is statistically reasonable only if you can get the sample you need — which in comparative-historical work you often can't."

This contradicts what I had in my PSY 251 notes (Sep 25) that 0.05 is universal across behavioral sciences. Apparently in sociology + comparative politics, 0.10 is sometimes acceptable w/ appropriate caveats. Going to flag this in my PSY problem set discussion section — the "universal threshold" claim is a disciplinary convention, not a statistical necessity.

Broader: the replication crisis is mostly a psych crisis because of how their field uses 0.05. Other disciplines have different conventions for different reasons.`,
    wordCount: 259,
  },
]

export default sampleNotes
