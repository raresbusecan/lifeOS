# LifeOS Agent Development Plan

> Plan operațional pentru transformarea Agent Foundation într-un sistem local de dezvoltare software orchestrată de mai mulți agenți AI.
>
> **Status:** PLANIFICAT
> **Mod de execuție:** local-only
> **Regulă fundamentală:** workflow-ul este impus de cod, nu de LLM.

---

# 1. Obiectivul proiectului

Construirea unui sistem local de dezvoltare software care funcționează similar unei mici firme de development:

```text
Plan general
    ↓
Sprint
    ↓
Task
    ↓
Analiză
    ↓
Consiliu
    ↓
Task Contract
    ↓
Impact Map
    ↓
Implementare
    ↓
Testare
    ↓
Triage
    ↓
    ├── PASS → DONE
    │
    ├── RELATED BUG → CODER
    │
    └── UNRELATED BUG → NEW TASK
```

Sistemul trebuie să poată executa task-uri în mod controlat, repetabil și verificabil.

Modelele AI sunt specialiști.

Orchestratorul este autoritatea.

Codul workflow-ului este autoritatea finală.

---

# 2. Principii fundamentale

## 2.1 Workflow-ul este controlat de cod

Niciun LLM nu poate:

- schimba arbitrar statusul unui task;
- sări peste etape;
- declara task-ul `DONE`;
- modifica alt departament;
- depăși limita de attempts;
- ignora un failure;
- crea/modifica task-uri arbitrar;
- modifica repository-ul în afara scope-ului aprobat.

LLM-ul poate doar să furnizeze un rezultat structurat.

Workflow Engine-ul validează rezultatul.

---

# 3. Local-only

În această etapă NU folosim:

- Pull Requests;
- GitHub workflow;
- staging server;
- production/live;
- deployment automat;
- CI extern.

Totul se execută local.

Git este folosit local pentru izolare, checkpoint-uri, commit-uri și rollback.

---

# 4. Arhitectura generală

```text
                    MASTER PLAN
                         │
                         ▼
                  SPRINT MANAGER
                         │
                         ▼
                    TASK MANAGER
                         │
                         ▼
                 COUNCIL / ANALYSIS
                         │
                         ▼
                  TASK CONTRACT
                         │
                         ▼
                   IMPACT MAP
                         │
                         ▼
                    GIT AGENT
                         │
                         ▼
                      CODER
                         │
                         ▼
                      TESTER
                         │
                         ▼
                      TRIAGE
                    /         \
                   /           \
             RELATED         UNRELATED
                │                │
                ▼                ▼
              CODER           NEW TASK
                │
                ▼
             TESTER
                │
                ▼
               DONE
```

Workflow Engine-ul este în afara tuturor agenților.

---

# 5. Departamentele AI

Fiecare agent are o responsabilitate clară.

## 5.1 Planner

Responsabil:

- înțelegerea obiectivului;
- descompunerea problemei;
- identificarea rezultatului dorit;
- formularea criteriilor inițiale.

NU modifică repository-ul.

---

## 5.2 Analyst

Responsabil:

- analiza problemei;
- analiza codului relevant;
- identificarea dependențelor;
- identificarea riscurilor;
- identificarea comportamentului existent.

NU modifică repository-ul.

---

## 5.3 Architect

Responsabil:

- impact arhitectural;
- componente implicate;
- compatibilitate cu arhitectura existentă;
- identificarea eventualelor decizii arhitecturale.

NU modifică repository-ul.

---

## 5.4 Coder

Responsabil:

- implementarea taskului;
- modificarea codului;
- adăugarea/modificarea testelor;
- rularea verificărilor locale.

Coderul trebuie să respecte Task Contract și Impact Map.

---

## 5.5 Tester / QA

Responsabil:

- verificarea implementării;
- rularea testelor;
- verificarea criteriilor de acceptare;
- regression testing;
- identificarea bug-urilor;
- clasificarea failure-urilor.

Testerul NU repară codul.

---

## 5.6 Triage Agent

Responsabil:

- analizarea failure-ului;
- stabilirea dacă problema este legată de task;
- identificarea cauzei probabile;
- propunerea unui task nou pentru probleme independente.

Rezultatul poate fi:

```text
RELATED
UNRELATED
AMBIGUOUS
```

---

## 5.7 Git Agent

Responsabil:

- branch;
- status;
- diff;
- commit;
- checkpoint;
- rollback;
- verificarea scope-ului modificărilor.

Git Agent-ul nu modifică implementarea.

---

## 5.8 Reviewer

Responsabil:

- verificarea rezultatului final;
- verificarea respectării taskului;
- verificarea modificărilor;
- verificarea testelor;
- verificarea absenței modificărilor colaterale.

---

# 6. Execuția modelelor

Modelele NU rulează simultan.

La un moment dat rulează un singur model.

Exemplu:

```text
Planner
   ↓
stop
   ↓
Architect
   ↓
stop
   ↓
Coder
   ↓
stop
   ↓
Tester
   ↓
stop
```

Modelul poate fi ales în funcție de departament.

Exemplu:

```text
Planner       → model mic
Analyst       → model mic/mediu
Architect     → model mediu
Coder         → Qwen3-Coder 30B
Tester        → model mic/mediu
Triage        → model mic/mediu
Git           → model mic
Reviewer      → model mediu
```

Nu este obligatoriu ca fiecare departament să aibă propriul model permanent.

Model Router-ul decide ce model este necesar.

---

# 7. Model Router

Model Router-ul stabilește ce model rulează pentru fiecare etapă.

Factori:

- complexitatea taskului;
- tipul taskului;
- departamentul;
- dimensiunea contextului;
- costul CPU/RAM;
- necesitatea de reasoning;
- istoricul failure-urilor.

Exemplu:

```text
simple planning
    → small model

simple test analysis
    → small model

frontend implementation
    → coder model

complex architectural problem
    → stronger model
```

---

# 8. Task Model

Fiecare task trebuie să aibă o structură standard.

```text
Task
├── id
├── title
├── description
├── objective
├── acceptance_criteria
├── priority
├── department
├── status
├── attempt
├── max_attempts
├── scope
├── impact_map
├── required_tests
├── dependencies
├── history
├── failures
├── decisions
├── checkpoints
└── created_tasks
```

---

# 9. Task Contract

Înainte ca task-ul să ajungă la Coder se creează un Task Contract.

Acesta definește:

### Obiectiv

Ce trebuie făcut.

### Acceptance Criteria

Cum știm că este făcut corect.

### Scope

Ce componente sunt relevante.

### Constraints

Ce NU trebuie modificat.

### Tests

Ce trebuie verificat.

### Dependencies

Ce alte componente pot fi afectate.

---

# 10. Impact Map

Consiliul inițial trebuie să estimeze impactul taskului.

Impact Map:

```text
Files to modify
Files possibly affected
Files to create
Tests to modify
Tests to create
Components affected
Components explicitly protected
Dependencies
Architecture risks
```

Exemplu:

```text
FILES_TO_MODIFY
- frontend/transactions/TransactionList.tsx
- frontend/stores/transactions.ts

FILES_TO_CREATE
- frontend/transactions/TransactionFilter.tsx

TESTS_TO_MODIFY
- tests/transactions/TransactionList.test.tsx

POSSIBLY_AFFECTED
- dashboard
- transaction summary

DO_NOT_TOUCH
- authentication
- profile
```

---

# 11. Impact Map nu este o limită rigidă

Impact Map este o predicție.

Nu presupunem că analiza inițială este perfectă.

Dacă Coder descoperă că un alt fișier trebuie modificat:

```text
Coder
 ↓
Scope Change Request
 ↓
Workflow validation
 ↓
Council / approval
 ↓
Impact Map update
 ↓
Coder continues
```

Coderul nu poate modifica pur și simplu fișierul și explica ulterior.

---

# 12. State Machine

Workflow-ul oficial:

```text
CREATED
   ↓
ANALYSIS
   ↓
COUNCIL
   ↓
CONTRACT_READY
   ↓
IMPACT_APPROVED
   ↓
GIT_READY
   ↓
CODING
   ↓
IMPLEMENTED
   ↓
TESTING
   ↓
TRIAGE
```

Din `TRIAGE`:

```text
PASS
 ↓
REVIEW
 ↓
DONE
```

sau:

```text
RELATED_FAILURE
 ↓
FIX_REQUIRED
 ↓
CODING
```

sau:

```text
UNRELATED_FAILURE
 ↓
NEW_TASK_CREATED
 ↓
CURRENT_TASK_CONTINUES
```

sau:

```text
AMBIGUOUS
 ↓
COUNCIL_REVIEW
```

---

# 13. Regula pentru bug-uri independente

Un failure descoperit de Tester NU aparține automat taskului curent.

Trebuie analizat.

Exemplu:

Task:

```text
Add transaction filtering
```

Tester găsește:

```text
Dashboard crashes when avatar is missing
```

Dacă problema nu este cauzată de task:

```text
Task #42
    ↓
TEST FAILURE
    ↓
TRIAGE
    ↓
UNRELATED
    ↓
Create Task #43
```

Task #42 nu este modificat pentru a rezolva Task #43.

---

# 14. Related vs Unrelated

Triage-ul trebuie să folosească:

```text
Original Task
Task Contract
Acceptance Criteria
Impact Map
Git diff
Changed files
Failed tests
Stack trace
Repository context
Task history
```

Clasificarea:

```text
RELATED
```

înseamnă că failure-ul este probabil cauzat de implementarea taskului.

```text
UNRELATED
```

înseamnă că problema este independentă și trebuie urmărită printr-un task separat.

```text
AMBIGUOUS
```

înseamnă că nu există suficiente dovezi.

În cazul `AMBIGUOUS`, task-ul nu este automat retrimis la Coder.

Este trimis la Council.

---

# 15. Council

Council-ul este un ciclu secvențial.

NU pornim toți agenții simultan.

Exemplu:

```text
Planner
 ↓
Analyst
 ↓
Architect
 ↓
Tester
 ↓
Reviewer
```

Fiecare primește:

- task;
- context;
- rezultatele agenților anteriori;
- repository information;
- task history.

Fiecare adaugă propriul verdict.

---

# 16. Council Decision

Council-ul poate produce:

```text
READY
```

```text
NEEDS_CLARIFICATION
```

```text
ARCHITECTURE_REVIEW
```

```text
SPLIT_TASK
```

```text
CREATE_NEW_TASK
```

```text
BLOCKED
```

---

# 17. Maximum 3 Attempts

Fiecare task are maximum:

```text
3 attempts
```

Flux:

```text
Attempt 1
Coder → Tester

FAIL
 ↓

Attempt 2
Coder → Tester

FAIL
 ↓

Attempt 3
Coder → Tester

FAIL
 ↓

Council
```

Nu există loop infinit.

---

# 18. Attempts trebuie să fie informative

Fiecare attempt trebuie să păstreze:

```text
attempt_number
changes
tests
failures
analysis
result
```

Council-ul trebuie să vadă istoricul complet.

---

# 19. Checkpoint System

Înainte de implementare:

```text
checkpoint created
```

După implementare:

```text
checkpoint updated
```

În cazul unei implementări eșuate:

```text
rollback possible
```

Checkpoint-ul permite:

- recovery;
- reproducerea taskului;
- compararea attempts;
- rollback.

---

# 20. Git Isolation

Fiecare task primește un branch local.

Exemplu:

```text
main
 └── task/TASK-042-transaction-filter
```

Coderul lucrează doar pe branch-ul taskului.

Git Agent verifică:

```text
git status
git diff
changed files
untracked files
```

---

# 21. Scope Enforcement

Înainte de finalizare:

```text
Expected files
        vs
Actual files
```

Dacă există fișiere neașteptate:

```text
SCOPE_VIOLATION
```

Workflow-ul nu permite `DONE`.

Fișierul neașteptat trebuie:

- justificat;
- aprobat;
- adăugat în Impact Map;

sau modificarea trebuie eliminată.

---

# 22. Testing

Testerul execută mai multe niveluri.

## Level 1 — Task tests

Teste specifice implementării.

## Level 2 — Component tests

Teste pentru componenta afectată.

## Level 3 — Integration tests

Verificarea interacțiunilor.

## Level 4 — Regression tests

Verificarea funcționalităților existente.

## Level 5 — Static checks

Exemple:

```text
TypeScript
ESLint
PHPUnit
Pint
build
```

Testele exacte depind de departamentul afectat.

---

# 23. Definition of Done

Un task poate deveni `DONE` numai dacă:

```text
[ ] Acceptance criteria sunt îndeplinite
[ ] Testele taskului trec
[ ] Testele relevante trec
[ ] Regression checks trec
[ ] Static checks relevante trec
[ ] Nu există unresolved related failures
[ ] Scope-ul este respectat
[ ] Modificările sunt în branch-ul taskului
[ ] Checkpoint-ul este valid
[ ] Reviewer-ul aprobă
[ ] Workflow Engine permite DONE
```

LLM-ul nu poate ocoli aceste condiții.

---

# 24. Workflow Guard

Workflow Guard este cod, nu AI.

Verifică:

```text
valid state transition
valid department
valid attempt
valid scope
valid tests
valid checkpoint
valid git state
valid approval
```

Exemplu:

```text
CODING → DONE
```

este invalid.

Trebuie:

```text
CODING
 ↓
IMPLEMENTED
 ↓
TESTING
 ↓
TRIAGE
 ↓
REVIEW
 ↓
DONE
```

---

# 25. Sprint Engine

După ce workflow-ul individual este stabil, construim Sprint Engine.

Flux:

```text
MASTER PLAN
     ↓
SPRINT
     ↓
TASKS
     ↓
TASK WORKFLOW
     ↓
DONE
     ↓
SPRINT REVIEW
     ↓
NEXT SPRINT
```

Sprint-ul conține:

```text
goal
tasks
priorities
dependencies
progress
completed tasks
blocked tasks
new tasks
retrospective
```

---

# 26. Task Discovery

În timpul sprintului pot apărea probleme noi.

Nu modificăm task-ul original automat.

Creăm:

```text
Parent Task
    │
    ├── Child Task
    ├── Bug Task
    └── Follow-up Task
```

Astfel păstrăm trasabilitatea.

---

# 27. Task Lineage

Fiecare task trebuie să știe:

```text
parent_task
created_from
related_tasks
blocked_by
blocks
```

Exemplu:

```text
TASK-042
Add transaction filtering

    ├── TASK-043
    │   Dashboard avatar crash
    │
    └── TASK-044
        Transaction summary regression
```

---

# 28. Context History

Agenții pot vedea istoricul relevant.

Exemplu:

```text
Task
 ↓
Planner result
 ↓
Architect result
 ↓
Coder result
 ↓
Tester result
 ↓
Triage result
```

Agentul următor primește rezultatele relevante ale celor anteriori.

Dar nu primește automat tot repository-ul sau toată memoria.

Contextul este selectat.

---

# 29. Department Permissions

Fiecare agent are permissions.

Exemplu:

```text
Planner
READ: repository
WRITE: none

Architect
READ: repository
WRITE: none

Coder
READ: repository
WRITE: assigned scope

Tester
READ: repository
WRITE: test reports

Git
READ: repository
WRITE: git metadata

Reviewer
READ: repository
WRITE: reports
```

Permission enforcement trebuie făcut de cod.

---

# 30. Agent Output Contract

Fiecare agent trebuie să returneze output structurat.

Nu:

```text
"Cred că ar trebui..."
```

ci:

```text
{
  "status": "...",
  "findings": [],
  "recommendations": [],
  "files": [],
  "risks": [],
  "confidence": 0.0
}
```

Schema exactă va fi definită pentru fiecare agent.

---

# 31. Failure Handling

Orice failure trebuie clasificat.

Categorii:

```text
IMPLEMENTATION_FAILURE
TEST_FAILURE
SCOPE_VIOLATION
ENVIRONMENT_FAILURE
PREEXISTING_BUG
TASK_AMBIGUITY
ARCHITECTURE_CONFLICT
DEPENDENCY_FAILURE
```

Nu toate failure-urile trebuie trimise la Coder.

---

# 32. Environment Failures

Exemplu:

```text
PHPUnit cannot start
```

Acesta nu este automat:

```text
CODER BUG
```

Poate fi:

```text
ENVIRONMENT_FAILURE
```

Workflow-ul trebuie să distingă între:

- cod greșit;
- test greșit;
- environment defect;
- bug preexistent.

---

# 33. Pre-existing Bugs

Repository-ul poate conține deja probleme.

Acestea trebuie înregistrate.

Dacă Testerul întâlnește un bug preexistent:

```text
PREEXISTING_BUG
```

→ creează task separat.

Nu obligăm task-ul curent să îl rezolve.

---

# 34. Architecture Protection

În faza de bootstrap:

```text
DO NOT MODIFY APPLICATION CODE
```

După intrarea în development workflow:

orice modificare arhitecturală trebuie:

```text
identified
→ documented
→ approved
→ implemented
```

Nu permitem refactorizări oportuniste.

---

# 35. Observability

Workflow Engine trebuie să logheze:

```text
task
agent
model
state
timestamp
input context
output
decision
attempt
tests
git changes
failure
transition
```

Acest lucru este esențial pentru debugging-ul agentului însuși.

---

# 36. Cost / Resource Management

Sistemul trebuie să știe:

```text
which model
why
how long
resource usage
task complexity
```

Modelele nu trebuie să rămână active inutil.

Flux:

```text
Load model
 ↓
Execute task
 ↓
Collect result
 ↓
Unload / release
 ↓
Next agent
```

---

# 37. Faze de implementare

## PHASE 1 — FOUNDATION AUDIT

### Obiectiv

Înțelegerea exactă a ceea ce există deja.

### Mini-task-uri

- [x] Audit `agent/`
- [x] Audit repository scanner
- [x] Audit hash system
- [x] Audit file cache
- [x] Audit content cache
- [x] Audit embedding cache
- [x] Audit semantic index
- [x] Audit semantic search
- [x] Audit conversation memory
- [x] Audit checkpoint/state
- [x] Audit testele existente
- [x] Documentare `EXISTS / PARTIAL / MISSING / BROKEN`

### Regula

Read-only.

Nu modificăm application code.

---

# PHASE 2 — WORKFLOW ENGINE

### Obiectiv

Construirea motorului de state machine.

### Mini-task-uri

- [x] Task model
- [x] Task persistence
- [x] Task status enum
- [x] State transitions
- [x] Transition validation
- [x] Attempt tracking
- [x] Completion rules
- [x] Failure rules
- [x] Workflow Guard
- [x] Workflow tests

---

# PHASE 3 — TASK CONTRACT

### Mini-task-uri

- [x] Task description schema
- [x] Acceptance criteria
- [x] Scope
- [x] Constraints
- [x] Required tests
- [x] Dependencies
- [x] Task validation

---

# PHASE 4 — IMPACT MAP

### Mini-task-uri

- [x] File impact model — DONE (`impactMap.ts`)
- [x] Component impact model — DONE (`componentsAffected` / `componentsProtected`)
- [x] New file prediction — DONE (`filesToCreate`)
- [x] Test impact prediction — DONE (`testsToModify` / `testsToCreate`)
- [x] Protected files — DONE (`componentsProtected`)
- [x] Confidence — DONE (validare 0–1 în `assertValidImpactMap`)
- [ ] Scope Change Request — DEFERRED: are nevoie de un Coder real care produce modificări; premature fără el (vezi secțiunea 11)
- [ ] Scope validation — DEFERRED: independent de git, dar are nevoie de "actual files" dintr-o implementare reală; se face natural odată cu Coder-ul (Phase 8)

---

# PHASE 5 — CHECKPOINT & GIT

**Status:** SKIPPED (decizie explicită) — branching/commit-uri gestionate manual de dezvoltator, nu de agent, în această etapă. Poate fi revizitat ulterior dacă apare nevoia de automatizare.


### Mini-task-uri

- [ ] Git branch manager
- [ ] Task branch creation
- [ ] Git status
- [ ] Git diff
- [ ] Checkpoint creation
- [ ] Rollback
- [ ] Scope comparison
- [ ] Commit policy

---

# PHASE 6 — AGENT RUNNER

### Mini-task-uri

- [ ] Agent interface
- [ ] Agent lifecycle
- [ ] Agent permissions
- [ ] Context injection
- [ ] Structured output
- [ ] Timeout
- [ ] Failure handling
- [ ] Model lifecycle

---

# PHASE 7 — PLANNER / ANALYST / ARCHITECT

### Mini-task-uri

- [ ] Planner agent
- [ ] Analyst agent
- [ ] Architect agent
- [ ] Sequential execution
- [ ] Shared task context
- [ ] Council input generation

---

# PHASE 8 — CODER

### Mini-task-uri

- [ ] Coder agent
- [ ] Scope enforcement
- [ ] Code generation
- [ ] Test generation
- [ ] Local validation
- [ ] Change reporting
- [ ] Checkpoint integration

---

# PHASE 9 — TESTER

### Mini-task-uri

- [ ] Test discovery
- [ ] Test execution
- [ ] Acceptance validation
- [ ] Regression validation
- [ ] Static checks
- [ ] Structured failure report

---

# PHASE 10 — TRIAGE

### Mini-task-uri

- [ ] Failure classification
- [ ] Related/unrelated detection
- [ ] Pre-existing bug detection
- [ ] Environment failure detection
- [ ] New task proposal
- [ ] Task lineage
- [ ] Ambiguous handling

---

# PHASE 11 — RETRY LOOP

### Mini-task-uri

- [ ] Attempt counter
- [ ] Maximum 3 attempts
- [ ] Failure context
- [ ] Coder retry
- [ ] Tester retry
- [ ] Council escalation

---

# PHASE 12 — COUNCIL

### Mini-task-uri

- [ ] Sequential council execution
- [ ] Planner review
- [ ] Analyst review
- [ ] Architect review
- [ ] Tester review
- [ ] Reviewer
- [ ] Council decision
- [ ] Council escalation
- [ ] Council history

---

# PHASE 13 — REVIEW & DONE

### Mini-task-uri

- [ ] Definition of Done
- [ ] Final reviewer
- [ ] Git validation
- [ ] Scope validation
- [ ] Test validation
- [ ] Workflow Guard validation
- [ ] DONE transition

---

# PHASE 14 — SPRINT ENGINE

### Mini-task-uri

- [ ] Sprint model
- [ ] Sprint creation
- [ ] Task assignment
- [ ] Priorities
- [ ] Dependencies
- [ ] Progress
- [ ] Sprint review
- [ ] Retrospective
- [ ] Next sprint generation

---

# PHASE 15 — MODEL ROUTER

### Mini-task-uri

- [ ] Model registry
- [ ] Model capabilities
- [ ] Department mapping
- [ ] Complexity estimation
- [ ] Resource estimation
- [ ] Model selection
- [ ] Model lifecycle
- [ ] CPU/RAM safeguards

---

# PHASE 16 — AUTONOMOUS DEVELOPMENT LOOP

Final workflow:

```text
MASTER PLAN
    ↓
SPRINT
    ↓
TASK
    ↓
PLANNER
    ↓
ANALYST
    ↓
ARCHITECT
    ↓
COUNCIL
    ↓
TASK CONTRACT
    ↓
IMPACT MAP
    ↓
GIT BRANCH
    ↓
CODER
    ↓
TESTER
    ↓
TRIAGE
    │
    ├── PASS
    │     ↓
    │   REVIEW
    │     ↓
    │    DONE
    │
    ├── RELATED
    │     ↓
    │   CODER
    │     ↓
    │   TESTER
    │
    ├── UNRELATED
    │     ↓
    │   NEW TASK
    │
    └── AMBIGUOUS
          ↓
        COUNCIL
```

---

# 38. Ordinea strictă de implementare

Nu sărim direct la agenți.

Ordinea obligatorie este:

```text
1. Foundation Audit
2. Workflow Engine
3. Task Model
4. State Machine
5. Task Contract
6. Impact Map
7. Checkpoints
8. Git Isolation
9. Agent Runner
10. Permissions
11. Planner
12. Analyst
13. Architect
14. Coder
15. Tester
16. Triage
17. Retry Engine
18. Council
19. Reviewer
20. Definition of Done
21. Sprint Engine
22. Model Router
23. Autonomous Sprint
```

---

# 39. Regula de lucru pentru noi

Pentru fiecare fază:

```text
PLAN
 ↓
MINI-TASK
 ↓
IMPLEMENT
 ↓
TEST
 ↓
VALIDATE
 ↓
CHECKPOINT
 ↓
NEXT MINI-TASK
```

Nu implementăm mai multe faze simultan.

---

# 40. Regula „nu refactorizăm fără motiv”

Nu modificăm cod existent doar pentru că:

- „ar fi mai frumos”;
- „ar putea fi mai rapid”;
- „ar fi mai modern”;
- „am găsit o arhitectură mai bună”.

Orice modificare structurală trebuie să aibă:

```text
problem
reason
impact
decision
validation
```

---

# 41. Criteriul final de succes

Sistemul este considerat funcțional când poate executa autonom un task real astfel:

```text
Task
 ↓
Understand
 ↓
Analyze
 ↓
Council
 ↓
Impact Map
 ↓
Contract
 ↓
Git branch
 ↓
Code
 ↓
Tests
 ↓
Triage
 ↓
Fix / New Task
 ↓
Maximum 3 attempts
 ↓
Council if necessary
 ↓
Review
 ↓
DONE
```

fără ca niciun LLM să poată încălca workflow-ul impus de cod.

---

# 42. CURRENT STEP

## STEP 6 — Impact Map (PHASE 4)

**Status:** NEXT MINI-TASK

### Stare curentă (COMPLETED UP TO STEP 5):

- [x] **Step 1 — Foundation Audit**: Scanare repository, hashing, content/embedding cache, semantic index/search, memorie de conversație și integrare Ollama verificated.
- [x] **Step 2 — Workflow Engine**: `Task`, `TaskStore`, istoric de tranziții, child tasks, scope classifier și limită de 3 attempts.
- [x] **Step 3 — Task Model & Persistence**: Persistență locală în `.agent/runtime/tasks.json`, snapshot serialization, stările oficiale ale planului.
- [x] **Step 4 — State Machine & Workflow Guard**: Regulile stricte de tranziție ale stărilor oficiale impuse de cod prin `WorkflowGuard`.
- [x] **Step 5 — Task Contract**: Interfață `TaskContract`, validare imutabilă, integrare cu `TaskStore` și impunere în `WorkflowGuard` pentru stările `CONTRACT_READY`, `IMPACT_APPROVED`, `GIT_READY`, `CODING`.

### Următorul obiectiv (STEP 6 — Impact Map):

Să construim schema `ImpactMap` (fișiere modificate/create, teste modificate/create, componente afectate/protejate, riscuri arhitecturale) și să impunem prin `WorkflowGuard` prezența unui `ImpactMap` aprobat înainte de avansarea task-ului în starea `IMPACT_APPROVED`.

### Checklist Step 6:

* [x] File impact model (`filesToModify`, `filesToCreate`)
* [x] Component impact model (`componentsAffected`, `componentsProtected`)
* [x] Test impact model (`testsToModify`, `testsToCreate`)
* [x] Architecture risks & confidence
* [x] Validation and enforcement in Workflow Guard
* [x] Unit & integration tests for Impact Map


### Decizie de scop (Phase 5 & rest Phase 4):
* Git branching/checkpoint automation (Phase 5) — SKIPPED, gestionat manual de dezvoltator.
* Scope Change Request + Scope Validation (rest Phase 4) — DEFERRED până există un Coder real (Phase 8) care produce modificări de comparat.


---


### Următorul obiectiv (STEP 7 — Agent Runner, PHASE 6):

Să construim interfața și lifecycle-ul prin care rulează efectiv un agent AI: agent interface, permissions, context injection, output structurat, timeout, failure handling, model lifecycle. Aceasta e infrastructura necesară înainte de a implementa Planner/Analyst/Architect (Phase 7) și Coder (Phase 8).

### Checklist Step 7:

* [ ] Agent interface
* [ ] Agent lifecycle
* [ ] Agent permissions
* [ ] Context injection
* [ ] Structured output
* [ ] Timeout
* [ ] Failure handling
* [ ] Model lifecycle



## 7.1 Hybrid Local/Cloud Execution (decizie, Step 7)

Din motive de performanță hardware (laptop, nu server dedicat), regula
"local-only" din secțiunea 3 se relaxează punctual, doar pentru rolul Coder:

- Toate celelalte roluri (Planner, Analyst, Architect, Tester, Triage, Git,
  Reviewer) rulează local, prin Ollama, ca până acum.
- Rolul Coder poate rula fie local (model mai mic, pentru dezvoltare/teste),
  fie printr-un provider cloud gratuit (OpenRouter, model `qwen3-coder:free`),
  ales explicit prin configurație, nu implicit.
- Agent Runner-ul (Phase 6) suportă ambele căi printr-o interfață comună de
  chat client, fără să știe restul sistemului ce provider rulează efectiv.
- Rate limits cunoscute pentru varianta cloud (OpenRouter free): 20
  cereri/minut, 200 cereri/zi — suficient pentru workflow-ul curent
  (max 3 attempts/task înainte de escaladare la Council).
- Datele trimise către provider-ul cloud nu mai sunt strict locale; decizie
  asumată conștient, nu implicită.

# END OF PLAN

Lucrează direct în repository-ul local:

`/Users/busecan/Desktop/orgOS/lifeOS`

Scopul tău este să continui implementarea agentului LifeOS exact din starea
actuală, fără să refaci sau să înlocuiești componente care există deja.

Reguli de scope:

- Analizează și modifică doar `agent/` și `.agent/`.
- Exclude complet `frontend/` și `backend/`: nu le analiza, nu le modifica
  și nu propune schimbări pentru ele.
- Planul activ este:
  `/Users/busecan/Desktop/orgOS/AGENT_DEVELOPMENT_PLAN.md`
- `PROJECT_STATE.md` este depășit; îl poți citi doar ca istoric, nu ca plan
  sau sursă de adevăr.
- Codul existent și `git status` sunt sursa de adevăr pentru starea curentă.
- Înainte de orice modificare, inspectează `git status` și păstrează toate
  schimbările existente.
- Nu face commit, push, reset, checkout distructiv sau modificări în afara
  scope-ului fără acord explicit.

Starea deja implementată, care trebuie păstrată:

- Scanare repository, hashing, content cache, embedding cache, semantic
  index/search, memorie de conversație și integrare Ollama.
- `Task`, `TaskStore`, istoric de tranziții, child tasks, scope classifier
  și limită de 3 attempts.
- Persistență locală pentru task-uri în `.agent/runtime/tasks.json` cu
  snapshot serialization.
- Stările oficiale ale planului:
  `CREATED → ANALYSIS → COUNCIL → CONTRACT_READY → IMPACT_APPROVED →
  GIT_READY → CODING → IMPLEMENTED → TESTING → TRIAGE → REVIEW → DONE`
- Ruta de retry: `TRIAGE → FIX_REQUIRED → CODING`, cu maximum 3 attempts și
  escaladare la `COUNCIL`.
- `WorkflowGuard` impune regulile stricte de tranziție ale stărilor oficiale.
- `TaskContract` (`taskContract.ts`) este definit și impus prin
  `WorkflowGuard` pentru avansarea task-urilor către `CONTRACT_READY`,
  `IMPACT_APPROVED`, `GIT_READY` și `CODING`.
- `ImpactMap` (`impactMap.ts`) este definit, validat în `taskValidator.ts`,
  serializat corect (deep-copy) în `taskStore.ts`, și impus prin
  `WorkflowGuard` pentru tranziția `CONTRACT_READY → IMPACT_APPROVED`.
- Suite completă de teste unitare și de integrare în
  `agent/src/workflow/__tests__/` care trec 100% verde (typecheck + build +
  toate testele rulate individual).
- `src/agentRunner/` (nou, Phase 6 — Agent Runner):
  - `agentRole.ts` — cele 8 roluri (Planner, Analyst, Architect, Coder,
    Tester, Triage, Git, Reviewer).
  - `agentOutput.ts` — schema structurată de output
    (`status`, `findings`, `recommendations`, `files`, `risks`,
    `confidence`) + validare.
  - `agentDefinition.ts` — mapare statică rol → model → system prompt;
    doar `CODER` are momentan model configurat (`qwen3-coder:30b`, local,
    prin Ollama), restul sunt `null` (placeholder).
  - `agentRunner.ts` — execută un agent real prin `OllamaChatClient`,
    parsează și validează output-ul JSON conform contractului.
  - Test live confirmat, end-to-end, cu `qwen3-coder:30b` local — trece.
- `src/llm/ollama.ts` (`OllamaChatClient`) extins cu suport de `timeoutMs`
  opțional (implicit 5 minute în `agentRunner.ts`), cu tratare explicită a
  erorii de timeout. Testat atât pentru cazul fără timeout (nu modifică
  comportamentul existent din `src/agent/loop.ts` și `src/agent/planner.ts`,
  care nu-l folosesc), cât și pentru cazul în care timeout-ul chiar se
  declanșează (server HTTP local care nu răspunde niciodată, în
  `src/llm/__tests__/ollama-timeout.test.ts`).
- Există un modul separat, mai vechi și independent,
  `src/agent/` (`loop.ts`, `planner.ts`, `memory.ts`, `query.ts`,
  `contextMemory.ts`) — un agent generic de tip chat + tool-use pentru
  explorarea repo-ului, NEcuplat cu `src/workflow` sau `src/agentRunner`.
  Nu-l modifica decât dacă ți se cere explicit; nu-l confunda cu Agent
  Runner-ul din Phase 6.

Decizie de arhitectură (Step 7, în curs):

- Laptopul dezvoltatorului nu poate susține confortabil rulări repetate ale
  `qwen3-coder:30b` local (consum mare de resurse, risc de blocare fără
  timeout — acum rezolvat parțial prin `timeoutMs`).
- S-a decis o abordare hibridă: restul rolurilor rămân pe Ollama local;
  rolul CODER va putea rula și printr-un provider cloud gratuit
  (OpenRouter, model `qwen3-coder:free`, limite cunoscute: 20 cereri/minut,
  200 cereri/zi), ales explicit prin configurație, nu implicit.
- Această decizie relaxează punctual regula "local-only" din secțiunea 3 a
  planului — vezi noua secțiune `7.1 Hybrid Local/Cloud Execution` din
  `AGENT_DEVELOPMENT_PLAN.md`.

Cum se rulează și verifică testele:
În directorul `agent/`:
- Typecheck: `npm run typecheck`
- Compilare: `npm run build`
- Rulare teste: `node dist/<cale>/__tests__/<nume_test>.test.js` sau
  `for f in dist/<cale>/__tests__/*.test.js; do node "$f" || echo "FAILED: $f"; done`
- Ollama rulează local, verificat funcțional (`ollama list`,
  `curl -s http://localhost:11434/api/tags`); modele disponibile:
  `qwen3-coder:30b`, `nomic-embed-text:latest`.

Următorul mini-task (Step 7, continuare — Phase 6, Agent Runner):

Construiește un `CloudChatClient` (provider OpenRouter) cu aceeași formă
minimă de interfață ca `OllamaChatClient` (cel puțin metoda
`chat(messages): Promise<string>`), fără să modifici `OllamaChatClient`
existent. Extinde `agentDefinition.ts` ca fiecare `AgentDefinition` să
indice explicit un `provider: "ollama" | "openrouter"` alături de `model`.
Actualizează `agentRunner.ts` să aleagă clientul corect pe baza acestui
`provider`, păstrând exact același contract de output structurat și
validare (`agentOutput.ts`) indiferent de provider. Tratează explicit un
răspuns HTTP 429 (rate limit) cu un mesaj de eroare clar, distinct de alte
erori. Testează cu un apel real către OpenRouter (necesită o cheie API
validă, furnizată separat de dezvoltator, niciodată hardcodată în cod).

Începe prin a citi `AGENT_DEVELOPMENT_PLAN.md` (inclusiv noua secțiune 7.1)
și a analiza `src/agentRunner/` și `src/llm/ollama.ts` existente. Nu
produce un raport lung de audit. Confirmă concis: (1) ce ai găsit deja
implementat, (2) planul exact pentru `CloudChatClient`, (3) apoi
implementează, testează, validează, câte un mini-task mic la un moment
dat:

ANALIZEAZĂ
 → IMPLEMENTEAZĂ
 → TESTEAZĂ
 → VALIDEAZĂ
 → următorul mini-task





 7.2 — FIRST REAL DEVELOPMENT TEST
Obiectiv

Obiectivul acestei faze este validarea întregii arhitecturi Agent Runner + Workflow Engine prin executarea primului task real de development.

Nu urmărim încă autonomia completă a sistemului și nu implementăm încă Sprint Engine sau Model Router.

Scopul este să demonstrăm că sistemul poate:

Task
 ↓
Analysis
 ↓
Council
 ↓
Task Contract
 ↓
Impact Map
 ↓
Coder
 ↓
actual code changes
 ↓
Testing
 ↓
Triage
 ↓
Review
 ↓
DONE

fără ca LLM-ul să poată ocoli regulile impuse de cod.

7.2.1 — Regula fundamentală

Primul development test trebuie să demonstreze separarea dintre:

LLM

și:

Workflow Engine

LLM-ul poate:

analiza;
propune;
implementa;
interpreta rezultate;
clasifica failure-uri;
furniza structured output.

LLM-ul NU poate:

modifica arbitrar task state;
declara DONE;
modifica fișiere în afara scope-ului;
ignora un failure;
depăși maximum 3 attempts;
crea automat task-uri fără validarea Workflow Engine;
executa tranziții nepermise.
7.2.2 — Agent Context

Înainte de implementarea agenților reali trebuie introdus un context standardizat.

AgentContext

Contextul unui agent trebuie să poată conține:

task
task contract
impact map
repository context
relevant files
previous agent results
task history
attempt number
previous failures
decisions

Contextul trebuie selectat de cod.

Nu transmitem automat întreg repository-ul către fiecare agent.

ContextBuilder

Se introduce un component responsabil pentru construirea contextului:

Task
 ↓
ContextBuilder
 ↓
AgentContext
 ↓
AgentRunner
 ↓
LLM

ContextBuilder trebuie să selecteze numai informația relevantă pentru rolul curent.

Exemplu:

Planner

→ task objective
→ description
→ high-level repository context

Analyst

→ task
→ repository context
→ relevant files

Architect

→ task
→ analyst result
→ repository context
→ architecture information

Coder

→ task
→ contract
→ impact map
→ relevant files
→ architecture decisions
→ previous failures

Tester

→ task
→ contract
→ implementation result
→ changed files
→ test configuration

Triage

→ task
→ contract
→ impact map
→ git diff
→ test failures
→ history
7.2.3 — Chat Client Abstraction

Agent Runner-ul trebuie să fie independent de provider.

Interfața minimă:

ChatClient

chat(messages): Promise<string>

Implementări:

ChatClient
    ├── OllamaChatClient
    └── CloudChatClient

Agent Runner-ul nu trebuie să cunoască detalii despre API-ul providerului.

7.2.4 — Provider Selection

Fiecare AgentDefinition trebuie să declare explicit:

role
provider
model
systemPrompt

Provider:

ollama
openrouter

Exemplu:

CODER

provider: ollama
model: qwen3-coder:30b

sau:

CODER

provider: openrouter
model: qwen3-coder:free

Provider-ul este ales prin configurație.

LLM-ul nu poate schimba provider-ul.

7.2.5 — Controlled Repository Access

Coder-ul trebuie să poată efectua modificări reale asupra repository-ului.

Accesul trebuie să fie controlat prin cod.

Operațiile inițiale:

readFile
searchFiles
listFiles
writeFile

Permissions:

READ
WRITE
EXECUTE

Coder-ul primește WRITE numai pentru scope-ul aprobat.

7.2.6 — Coder Execution

Coder-ul trebuie să treacă de la:

LLM
 ↓
recommendations

la:

LLM
 ↓
implementation proposal
 ↓
workflow validation
 ↓
apply changes
 ↓
scope validation

Coder-ul trebuie să producă un rezultat structurat care descrie:

files changed
files created
changes
tests added
tests modified
implementation summary
risks

Workflow Engine-ul aplică modificările numai după validarea scope-ului.

7.2.7 — Scope Enforcement

După implementare:

Impact Map
     ↓
expected files
     │
     │
     ▼
actual changed files
     ↓
comparison

Dacă:

actual files

conține fișiere neaprobate:

SCOPE_VIOLATION

Task-ul nu poate deveni:

DONE

Fișierul trebuie:

removed

sau:

justified
→ Impact Map updated
→ Workflow validation
7.2.8 — Deterministic Test Execution

Testarea trebuie separată în:

Test Executor

și:

Tester Agent

Test Executor-ul execută efectiv:

task tests
component tests
integration tests
regression tests
static checks
build
typecheck

și produce un rezultat deterministic.

Exemplu:

TestExecutor
 ↓
command
 ↓
exit code
 ↓
stdout
 ↓
stderr
 ↓
duration
 ↓
TestResult

Tester Agent-ul interpretează rezultatul.

LLM-ul nu poate declara singur că testele au trecut.

7.2.9 — Test Result Model

Se introduce un model structurat:

TestResult

status
exitCode
command
stdout
stderr
duration
testsRun
testsPassed
testsFailed
failures

Status:

PASS
FAIL
ERROR
ENVIRONMENT_FAILURE
7.2.10 — Triage

Triage Agent primește:

Task
Task Contract
Impact Map
Changed files
Git diff
TestResult
Failure output
Task history
Previous attempts

Rezultatul trebuie să fie:

RELATED
UNRELATED
AMBIGUOUS
PREEXISTING
ENVIRONMENT

Workflow-ul decide ce se întâmplă mai departe.

LLM-ul nu poate executa direct tranziția.

7.2.11 — Retry Loop

Pentru:

RELATED

workflow-ul permite:

TRIAGE
 ↓
FIX_REQUIRED
 ↓
CODING
 ↓
TESTING
 ↓
TRIAGE

Maximum:

3 attempts

După al treilea failure:

TRIAGE
 ↓
COUNCIL

Attempt history trebuie păstrat integral.

7.2.12 — Unrelated Failure

Dacă Triage identifică:

UNRELATED

workflow-ul creează un task separat:

CURRENT TASK
     │
     └── NEW TASK

Task-ul curent nu este modificat pentru rezolvarea bug-ului independent.

Task lineage trebuie păstrat.

7.2.13 — Ambiguous Failure

Dacă:

AMBIGUOUS

workflow-ul NU retrimite automat task-ul la Coder.

Flux:

TRIAGE
 ↓
COUNCIL
 ↓
DECISION

Council-ul decide dacă:

RELATED
UNRELATED
NEW TASK
BLOCKED
RETRY
7.2.14 — Development Workflow Executor

Se introduce un orchestrator determinist responsabil pentru executarea workflow-ului.

Conceptual:

DevelopmentWorkflowExecutor

Responsabil:

read task state
 ↓
validate state
 ↓
build context
 ↓
select agent
 ↓
run agent
 ↓
validate output
 ↓
perform deterministic action
 ↓
validate result
 ↓
request state transition

Executorul nu trebuie să permită unui agent să execute direct tranziții arbitrare.

7.2.15 — Agent-to-State Mapping

Workflow-ul trebuie să definească explicit ce agent poate fi executat într-un anumit state.

Exemplu:

ANALYSIS
    → Analyst

COUNCIL
    → Planner
    → Analyst
    → Architect
    → Reviewer

CODING
    → Coder

TESTING
    → Tester

TRIAGE
    → Triage

REVIEW
    → Reviewer

Mapping-ul este cod.

Nu este decis de LLM.

7.2.16 — First Real Development Task

Primul test trebuie să folosească un task real, dar mic.

Task-ul trebuie să aibă:

clear objective
small scope
clear acceptance criteria
predictable tests
limited files
low architectural risk

Nu folosim primul test pentru:

large refactor
architecture rewrite
multiple subsystems
frontend + backend changes
unknown behavior
7.2.17 — First Development Test

Testul minim:

CREATE TASK
 ↓
ANALYSIS
 ↓
COUNCIL
 ↓
CONTRACT_READY
 ↓
IMPACT_APPROVED
 ↓
CODING
 ↓
IMPLEMENTED
 ↓
TESTING
 ↓
TRIAGE
 ↓
REVIEW
 ↓
DONE

Trebuie executat cu:

one model at a time

Exemplu:

Analyst
 ↓
model released

Architect
 ↓
model released

Coder
 ↓
qwen3-coder:30b
 ↓
model released

Tester
 ↓
model released

Triage
 ↓
model released

Reviewer
7.2.18 — First Test Success Criteria

Primul development test este considerat reușit numai dacă:

[ ] Task creat prin TaskStore

[ ] Task Contract generat și validat

[ ] Impact Map generat și validat

[ ] Agent Context construit prin cod

[ ] Planner/Analyst/Architect executați secvențial

[ ] Coder executat prin Agent Runner

[ ] Coder modifică efectiv repository-ul

[ ] Modificările sunt în scope

[ ] Testele sunt executate deterministic

[ ] Tester interpretează rezultatele

[ ] Triage clasifică rezultatul

[ ] Related failures pot intra în retry

[ ] Maximum 3 attempts este respectat

[ ] Unrelated failures pot crea child/new tasks

[ ] Reviewer verifică rezultatul

[ ] Workflow Guard validează DONE

[ ] Task ajunge DONE

[ ] Istoricul complet este persistent
7.2.19 — Ce NU este necesar pentru primul test

Următoarele componente pot rămâne pentru fazele ulterioare:

Git Agent automation
Automatic branch creation
Automatic commits
Automatic rollback
Sprint Engine
Autonomous Sprint
Advanced Model Router
Dynamic complexity routing
Cloud fallback
Multi-model parallel execution

Principiul rămâne:

ONE MODEL AT A TIME
7.2.20 — Ordinea de implementare către primul test

Ordinea strictă:

1. ChatClient abstraction

2. Provider support

3. AgentDefinition provider

4. AgentContext

5. ContextBuilder

6. Controlled repository tools

7. Coder execution

8. Scope enforcement

9. Test Executor

10. TestResult model

11. Tester integration

12. Triage integration

13. Retry integration

14. DevelopmentWorkflowExecutor

15. Agent-to-State mapping

16. Reviewer integration

17. End-to-end integration test

18. FIRST REAL DEVELOPMENT TEST

Fiecare pas urmează:

ANALYZE
 ↓
IMPLEMENT
 ↓
TEST
 ↓
VALIDATE
 ↓
CHECKPOINT
 ↓
NEXT MINI-TASK
7.2.21 — Definition of Success

După această fază, LifeOS trebuie să demonstreze că poate lua un task real și să îl ducă automat până la:

DONE

într-un workflow controlat de cod:

Task
 ↓
Agents
 ↓
LLM outputs
 ↓
Workflow validation
 ↓
Real code changes
 ↓
Real tests
 ↓
Triage
 ↓
Review
 ↓
DONE

Aceasta este prima dovadă că arhitectura multi-agent LifeOS funcționează în practică.

7.2.22 — Relația cu fazele existente

Această fază nu înlocuiește Phase 6–13.

Ea reprezintă o etapă de integrare transversală peste:

Phase 6 — Agent Runner
Phase 7 — Planner / Analyst / Architect
Phase 8 — Coder
Phase 9 — Tester
Phase 10 — Triage
Phase 11 — Retry
Phase 12 — Council
Phase 13 — Review

Implementarea trebuie făcută incremental, iar fiecare componentă trebuie să rămână compatibilă cu arhitectura existentă.

După trecerea cu succes a primului development test, continuăm cu:

Phase 14 — Sprint Engine
Phase 15 — Model Router
Phase 16 — Autonomous Development Loop
END — FIRST REAL DEVELOPMENT TEST