# 43. ROADMAP TO FIRST REAL DEVELOPMENT FLOW

Această secțiune definește drumul obligatoriu de la starea actuală a proiectului până la primul test real al arhitecturii multi-agent.

Obiectivul nu este încă un sistem complet autonom de tip Sprint Engine.

Primul obiectiv este demonstrarea unui singur Development Task executat end-to-end, local, folosind agenți secvențiali și un model Coder real.

---

## 43.1 FIRST REAL DEVELOPMENT TEST

Primul milestone major este:

```text
CREATE TASK
    ↓
PLANNER
    ↓
ANALYST
    ↓
ARCHITECT
    ↓
COUNCIL DECISION
    ↓
TASK CONTRACT
    ↓
IMPACT MAP
    ↓
CODER
    ↓
REAL REPOSITORY CHANGES
    ↓
TESTER
    ↓
TRIAGE
    ↓
REVIEWER
    ↓
DONE
```

Toți agenții rulează secvențial.

La un moment dat există un singur model LLM activ.

Modelul este încărcat pentru agentul curent, execută task-ul, rezultatul este colectat, apoi modelul este eliberat înainte de rularea următorului agent.

Pentru prima demonstrație:

```text
Planner    → Ollama small model
Analyst    → Ollama small model
Architect  → Ollama small/medium model
Coder      → qwen3-coder:30b
Tester     → Ollama small model
Triage     → Ollama small model
Reviewer   → Ollama small/medium model
```

Modelele exacte sunt configurate prin `ModelRegistry` și `ModelRouter`, nu hardcodate în workflow.

---

# 44. PHASE 6 — AGENT EXECUTION FOUNDATION

Înainte de implementarea tuturor agenților trebuie finalizată infrastructura comună de execuție.

## 44.1 Chat Client Interface

Definim o interfață comună:

```text
ChatClient
    ↓
chat(messages)
```

Implementări:

```text
OllamaChatClient
CloudChatClient
```

Provider-ul este transparent pentru `AgentRunner`.

Pentru primul development flow este suficient:

```text
OllamaChatClient
```

Cloud execution rămâne opțional.

### Done

* [ ] ChatClient interface
* [ ] Ollama implementation
* [ ] Optional OpenRouter implementation
* [ ] Provider error handling
* [ ] HTTP 429 handling
* [ ] Timeout handling

---

# 45. AGENT DEFINITION

Fiecare agent trebuie să aibă o definiție explicită.

```text
AgentDefinition

├── role
├── provider
├── model
├── systemPrompt
├── capabilities
├── permissions
└── outputSchema
```

Exemplu:

```text
Coder

provider: ollama
model: qwen3-coder:30b

capabilities:
- repository_read
- repository_write
- test_execution

permissions:
- read assigned scope
- write assigned scope
```

Modelul nu trebuie să fie considerat autoritatea.

Workflow Engine rămâne autoritatea.

---

# 46. AGENT CONTEXT ENGINE

Agentul nu primește automat întreg repository-ul.

Construim un context controlat.

```text
Task
 ↓
TaskContract
 ↓
ImpactMap
 ↓
TaskHistory
 ↓
RepositoryContext
 ↓
AgentContext
```

`AgentContext` trebuie să poată conține:

```text
task
contract
impactMap
repository summary
relevant files
relevant tests
previous agent results
previous failures
attempt information
constraints
permissions
```

Contextul trebuie să fie diferit în funcție de agent.

Exemplu:

```text
Planner
→ task + repository summary

Analyst
→ task + relevant files + planner result

Architect
→ task + analyst result + relevant architecture

Coder
→ task + contract + impact map + relevant files + council decision

Tester
→ task + contract + diff + test configuration

Triage
→ task + contract + impact map + diff + test failures + history

Reviewer
→ task + contract + diff + test results + triage result
```

### Done

* [ ] AgentContext
* [ ] ContextBuilder
* [ ] Role-specific context
* [ ] Context size control
* [ ] Relevant-file selection
* [ ] Previous-agent result injection

---

# 47. TOOL / CAPABILITY LAYER

LLM-ul nu trebuie să execute direct operații arbitrare asupra sistemului.

Operațiile trebuie expuse prin tool-uri controlate.

## Read tools

```text
listFiles
readFile
searchFiles
searchContent
getRepositorySummary
getGitStatus
getGitDiff
```

## Development tools

```text
writeFile
createFile
deleteFile
runTest
runTypecheck
runBuild
```

## Git tools

```text
gitStatus
gitDiff
gitCreateCheckpoint
gitRollback
```

Tool-urile sunt controlate de permissions și Workflow Guard.

---

# 48. PERMISSION ENGINE

Permissions trebuie verificate de cod.

Exemplu:

```text
Planner
READ repository
WRITE none

Analyst
READ repository
WRITE none

Architect
READ repository
WRITE none

Coder
READ repository
WRITE assigned scope

Tester
READ repository
WRITE test reports

Triage
READ repository
WRITE task proposals

Reviewer
READ repository
WRITE review reports
```

Un agent nu poate primi o permisiune doar pentru că o solicită în output.

---

# 49. CODER WRITE PATH

Acesta este unul dintre cele mai importante milestones.

Coderul trebuie să poată produce modificări reale în repository.

Flux:

```text
Coder
 ↓
proposed file operation
 ↓
Permission Check
 ↓
Scope Check
 ↓
Impact Map Check
 ↓
Workflow Guard
 ↓
writeFile()
```

Dacă fișierul nu este permis:

```text
SCOPE_VIOLATION
```

Nu se scrie fișierul.

Dacă fișierul este în afara Impact Map:

```text
SCOPE_CHANGE_REQUIRED
```

Coderul nu poate modifica fișierul până când workflow-ul aprobă schimbarea.

---

# 50. TEST EXECUTION ENGINE

Testele nu sunt evaluate de LLM.

Testele sunt executate de cod.

Exemplu:

```text
Tester
 ↓
TestExecutor
 ↓
npm run typecheck
 ↓
npm run build
 ↓
relevant tests
 ↓
TestReport
```

`TestReport` trebuie să conțină:

```text
command
exitCode
stdout
stderr
duration
passed
failed
```

LLM-ul poate interpreta `TestReport`, dar nu poate modifica rezultatul.

---

# 51. TEST LEVELS

Tester-ul trebuie să poată executa:

```text
Level 1
Task tests

Level 2
Component tests

Level 3
Integration tests

Level 4
Regression tests

Level 5
Static checks
```

Pentru primul development test nu este obligatoriu să existe toate cele cinci niveluri.

Primul test trebuie să demonstreze cel puțin:

```text
typecheck
build
task-specific test
```

---

# 52. AGENT RESULT STORE

Fiecare execuție trebuie persistată.

Exemplu:

```text
AgentExecution

├── executionId
├── taskId
├── attempt
├── role
├── model
├── provider
├── startedAt
├── completedAt
├── inputContext
├── output
├── toolCalls
├── filesChanged
├── tests
├── error
└── status
```

Scopul este reproducibilitatea.

Trebuie să putem reconstrui exact ce s-a întâmplat într-un task.

---

# 53. MODEL MANAGER

Modelele nu trebuie să rămână active inutil.

Flux:

```text
Agent requested
 ↓
ModelRouter
 ↓
ModelManager
 ↓
load model
 ↓
execute
 ↓
collect result
 ↓
release model
 ↓
next agent
```

Regula:

```text
MAXIMUM ONE ACTIVE LLM MODEL
```

Pentru primul development flow, `qwen3-coder:30b` este modelul recomandat pentru Coder.

---

# 54. MODEL REGISTRY

Introducem un registry central.

```text
ModelRegistry

model
provider
capabilities
contextWindow
resourceClass
codingCapability
reasoningCapability
availability
```

Exemplu conceptual:

```text
qwen3:8b

resourceClass: small
codingCapability: medium
reasoningCapability: medium

qwen3-coder:30b

resourceClass: large
codingCapability: high
reasoningCapability: high
```

Modelul este ales prin capability matching.

---

# 55. MODEL ROUTER

Router-ul primește:

```text
AgentRole
TaskComplexity
RequiredCapabilities
ResourceConstraints
FailureHistory
```

și returnează:

```text
ModelSelection
```

Exemplu:

```text
Coder
 ↓
codingCapability = high
 ↓
qwen3-coder:30b
```

Pentru primul test nu este necesară o strategie complexă de routing.

Este suficient:

```text
role → configured model
```

dar interfața trebuie proiectată astfel încât routing-ul dinamic să poată fi adăugat ulterior.

---

# 56. PHASE 7 — PLANNER / ANALYST / ARCHITECT

Implementăm agenții de analiză.

## Planner

Produce:

```text
objective
initialPlan
acceptanceCriteria
questions
```

Nu modifică repository-ul.

## Analyst

Produce:

```text
findings
relevantFiles
dependencies
risks
existingBehavior
```

Nu modifică repository-ul.

## Architect

Produce:

```text
architectureImpact
componentsAffected
componentsProtected
architectureRisks
recommendation
```

Nu modifică repository-ul.

---

# 57. COUNCIL PREPARATION

Council-ul nu trebuie să fie un grup paralel de LLM-uri.

Este o secvență:

```text
Planner
 ↓
Analyst
 ↓
Architect
 ↓
Council Decision
```

Fiecare agent primește rezultatele relevante ale agenților anteriori.

Council-ul trebuie să producă:

```text
READY
NEEDS_CLARIFICATION
ARCHITECTURE_REVIEW
SPLIT_TASK
CREATE_NEW_TASK
BLOCKED
```

Pentru primul flow este suficient:

```text
READY
BLOCKED
NEEDS_CLARIFICATION
```

---

# 58. TASK CONTRACT GENERATION

După analiza inițială:

```text
Planner
 ↓
Analyst
 ↓
Architect
 ↓
Council
 ↓
TaskContract
```

Contractul trebuie să conțină:

```text
objective
acceptanceCriteria
scope
constraints
requiredTests
dependencies
```

Workflow Guard validează contractul.

---

# 59. IMPACT MAP GENERATION

După contract:

```text
TaskContract
 ↓
Impact Analysis
 ↓
ImpactMap
 ↓
WorkflowGuard
 ↓
IMPACT_APPROVED
```

ImpactMap trebuie să includă:

```text
filesToModify
filesToCreate
testsToModify
testsToCreate
componentsAffected
componentsProtected
architectureRisks
confidence
```

ImpactMap rămâne o predicție.

Actualul repository diff este sursa de adevăr pentru modificările reale.

---

# 60. FIRST CODER INTEGRATION

După:

```text
IMPACT_APPROVED
```

task-ul poate intra în:

```text
GIT_READY
 ↓
CODING
```

Coderul primește:

```text
Task
TaskContract
ImpactMap
CouncilDecision
relevant repository context
relevant files
relevant tests
permissions
```

Coderul poate:

```text
read
analyze
modify
create
test
```

dar numai în scope-ul permis.

---

# 61. FIRST REAL CODER TEST

Primul test al Coderului trebuie să fie foarte mic.

Criterii:

```text
1-3 source files
1-2 test files
clear acceptance criteria
low architectural risk
no frontend/backend dependency
```

Task-ul trebuie să fie în `agent/`.

Scopul nu este complexitatea taskului.

Scopul este verificarea pipeline-ului.

---

# 62. TESTER FLOW

După Coder:

```text
CODING
 ↓
IMPLEMENTED
 ↓
TESTING
```

Tester-ul primește:

```text
Task
Contract
ImpactMap
Changed files
Git diff
Coder result
```

Execută:

```text
typecheck
build
task tests
relevant regression tests
```

Rezultatul devine:

```text
TestReport
```

---

# 63. TRIAGE FLOW

După testing:

```text
TESTING
 ↓
TRIAGE
```

Triage primește:

```text
Task
Contract
ImpactMap
Git diff
TestReport
Task history
Attempt history
```

Clasifică:

```text
PASS
RELATED
UNRELATED
AMBIGUOUS
```

---

# 64. TRIAGE — PASS

Dacă:

```text
TRIAGE = PASS
```

workflow:

```text
TRIAGE
 ↓
REVIEW
 ↓
DONE
```

Reviewer-ul verifică:

```text
acceptance criteria
scope
diff
tests
related failures
contract
impact map
```

Workflow Guard verifică toate condițiile finale.

Numai Workflow Guard poate permite:

```text
REVIEW → DONE
```

---

# 65. TRIAGE — RELATED

Dacă:

```text
TRIAGE = RELATED
```

workflow:

```text
TRIAGE
 ↓
FIX_REQUIRED
 ↓
CODING
 ↓
TESTING
 ↓
TRIAGE
```

Attempt counter este incrementat.

Maximum:

```text
3 attempts
```

După attempt 3:

```text
FAIL
 ↓
COUNCIL
```

Nu există loop infinit.

---

# 66. TRIAGE — UNRELATED

Dacă:

```text
TRIAGE = UNRELATED
```

workflow:

```text
TRIAGE
 ↓
NEW_TASK
```

Se creează:

```text
Child Task
```

cu:

```text
parentTask
createdFrom
description
evidence
```

Task-ul original nu este modificat pentru a rezolva problema independentă.

---

# 67. TRIAGE — AMBIGUOUS

Dacă:

```text
TRIAGE = AMBIGUOUS
```

workflow:

```text
TRIAGE
 ↓
COUNCIL
```

Council-ul primește toate dovezile.

Nu se permite retry automat al Coderului fără o decizie.

---

# 68. REVIEW ENGINE

Reviewer-ul este ultimul agent AI înainte de `DONE`.

Reviewer-ul verifică:

```text
TaskContract
ImpactMap
GitDiff
TestReport
TriageReport
CoderResult
```

Produce:

```text
APPROVED
REJECTED
NEEDS_CHANGES
```

Workflow Guard validează rezultatul.

---

# 69. DEFINITION OF DONE ENFORCEMENT

`DONE` este permis numai dacă:

```text
Task exists
AND

TaskContract valid
AND

ImpactMap approved
AND

Coder completed
AND

Tests completed
AND

No unresolved related failure
AND

Scope valid
AND

Reviewer approved
AND

Attempt <= maxAttempts
AND

Workflow transition valid
```

LLM-ul nu poate seta direct:

```text
DONE
```

---

# 70. FIRST END-TO-END LOCAL DEMONSTRATION

Primul test real trebuie să producă următorul flow:

```text
TASK-TEST-001
     │
     ▼
  PLANNER
     │
     ▼
  ANALYST
     │
     ▼
 ARCHITECT
     │
     ▼
 COUNCIL
     │
     ▼
 CONTRACT
     │
     ▼
 IMPACT MAP
     │
     ▼
   CODER
     │
     │ qwen3-coder:30b
     ▼
 REAL FILE CHANGES
     │
     ▼
  TESTER
     │
     ▼
  TRIAGE
     │
     ├──────── PASS ────────┐
     │                      │
     │                      ▼
     │                   REVIEW
     │                      │
     │                      ▼
     │                     DONE
     │
     ├──── RELATED
     │       │
     │       ▼
     │     CODER
     │
     ├──── UNRELATED
     │       │
     │       ▼
     │   NEW TASK
     │
     └──── AMBIGUOUS
             │
             ▼
           COUNCIL
```

Acesta este primul criteriu major de succes al arhitecturii.

---

# 71. DEVELOPMENT CONSOLE

După ce flow-ul de mai sus funcționează prin CLI intern, putem construi o interfață simplă de Developer Console.

Developer Console nu implementează un workflow paralel.

Este doar o interfață peste:

```text
AgentRunner
WorkflowEngine
ToolLayer
ModelManager
TaskStore
ExecutionStore
```

Poate permite:

```text
create task
inspect task
run next step
approve proposed change
reject proposed change
inspect agent output
inspect tests
inspect diff
continue workflow
```

Exemplu:

```text
LifeOS Developer Console

Task: TASK-001
State: CODING
Agent: Coder
Model: qwen3-coder:30b

Agent output:
...

Proposed changes:
...

[Approve]
[Reject]
```

Developer Console este opțională pentru primul test.

CLI-ul este suficient.

---

# 72. PHASE 11 — RETRY ENGINE

După primul flow PASS trebuie testat și failure path.

Scenariu:

```text
Coder
 ↓
Tester
 ↓
FAIL
 ↓
Triage
 ↓
RELATED
 ↓
Coder
 ↓
Tester
 ↓
PASS
```

Trebuie verificat:

```text
attempt 1
attempt 2
```

și că history-ul este păstrat.

Apoi se testează:

```text
attempt 1 FAIL
attempt 2 FAIL
attempt 3 FAIL
 ↓
COUNCIL
```

---

# 73. PHASE 12 — COUNCIL ESCALATION

Council-ul trebuie testat și ca mecanism de recuperare.

Scenariu:

```text
Coder
 ↓
Tester
 ↓
FAIL
 ↓
Triage
 ↓
RELATED
 ↓
Coder
 ↓
Tester
 ↓
FAIL
 ↓
Triage
 ↓
RELATED
 ↓
Coder
 ↓
Tester
 ↓
FAIL
 ↓
Triage
 ↓
COUNCIL
```

Council-ul trebuie să poată:

```text
request clarification
change approach
split task
identify architecture conflict
block task
```

Nu trebuie permis un al patrulea retry automat.

---

# 74. PHASE 14 — SPRINT ENGINE

După ce Development Task Loop funcționează:

```text
Task
→ Done
```

construim:

```text
Sprint
```

Sprint-ul gestionează:

```text
tasks
priority
dependencies
progress
blocked tasks
completed tasks
new tasks
```

Flux:

```text
SPRINT
 ↓
TASK 1
 ↓
DONE
 ↓
TASK 2
 ↓
DONE
 ↓
TASK 3
 ↓
DONE
 ↓
SPRINT REVIEW
```

---

# 75. PHASE 15 — MODEL ROUTING

După ce agenții funcționează stabil, activăm routing-ul real.

Exemplu:

```text
Planner
→ qwen3:8b

Analyst
→ qwen3:8b

Architect
→ qwen3:14b

Coder
→ qwen3-coder:30b

Tester
→ qwen3:8b

Triage
→ qwen3:8b

Reviewer
→ qwen3:14b
```

Toate modelele rulează secvențial.

Nu se pornesc simultan.

ModelRouter poate selecta modele diferite în funcție de:

```text
role
complexity
context
failure history
resource availability
```

---

# 76. PHASE 16 — AUTONOMOUS DEVELOPMENT LOOP

Abia după validarea tuturor componentelor anterioare activăm:

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
CONTRACT
 ↓
IMPACT MAP
 ↓
CODER
 ↓
TESTER
 ↓
TRIAGE
 ↓
RETRY / NEW TASK / REVIEW
 ↓
DONE
 ↓
NEXT TASK
 ↓
SPRINT REVIEW
```

Workflow Engine rămâne autoritatea finală.

LLM-urile sunt executori specializați.

---

# 77. FINAL ARCHITECTURE VALIDATION

Sistemul este considerat funcțional numai după ce următoarele scenarii sunt testate.

## Scenario A — Successful task

```text
Task
→ Planner
→ Analyst
→ Architect
→ Council
→ Contract
→ Impact
→ Coder
→ Tester PASS
→ Triage PASS
→ Reviewer
→ DONE
```

## Scenario B — Related failure and retry

```text
Coder
→ Tester FAIL
→ Triage RELATED
→ Coder
→ Tester PASS
→ DONE
```

## Scenario C — Three failed attempts

```text
Attempt 1 FAIL
Attempt 2 FAIL
Attempt 3 FAIL
→ Council
```

## Scenario D — Unrelated bug

```text
Tester
→ Triage UNRELATED
→ New Task
```

## Scenario E — Ambiguous failure

```text
Tester
→ Triage AMBIGUOUS
→ Council
```

## Scenario F — Scope violation

```text
Coder
→ unexpected file
→ Scope Guard
→ SCOPE_VIOLATION
→ change rejected
```

## Scenario G — Invalid transition

```text
CODING
→ DONE
```

must be rejected by Workflow Guard.

## Scenario H — Model failure

```text
Agent
→ model timeout
→ Agent Failure
→ workflow decision
```

No infinite execution.

---

# 78. IMPLEMENTATION ORDER AFTER STEP 6

Ordinea concretă recomandată din starea actuală este:

```text
STEP 7
ChatClient / AgentRunner completion

STEP 8
AgentContext + ContextBuilder

STEP 9
Tool / Capability Layer

STEP 10
Permission Engine

STEP 11
Controlled Coder Write Path

STEP 12
Test Execution Engine

STEP 13
Agent Execution Store

STEP 14
Model Manager

STEP 15
Model Registry

STEP 16
Planner

STEP 17
Analyst

STEP 18
Architect

STEP 19
Council Decision

STEP 20
Coder integration

STEP 21
Tester integration

STEP 22
Triage integration

STEP 23
Reviewer

STEP 24
First successful end-to-end development task

STEP 25
Retry Engine

STEP 26
Failure-path integration tests

STEP 27
Council escalation

STEP 28
Sprint Engine

STEP 29
Model Router

STEP 30
Autonomous Development Loop

STEP 31
Developer Console
```

Ordinea poate fi ajustată numai dacă implementarea existentă demonstrează că o dependență diferită este necesară.

---

# 79. MILESTONE GATES

Nu trecem la următoarea etapă doar pentru că fișierele există.

Fiecare milestone trebuie să aibă un test.

```text
GATE 1
AgentRunner executes one real model

GATE 2
Agent receives controlled context

GATE 3
Agent can use controlled read tools

GATE 4
Coder can modify an allowed file

GATE 5
Scope Guard rejects unauthorized modification

GATE 6
Tests execute independently of LLM

GATE 7
Planner → Analyst → Architect execute sequentially

GATE 8
Coder performs a real repository task

GATE 9
Tester validates the real modification

GATE 10
Triage classifies the result

GATE 11
Reviewer approves the result

GATE 12
Workflow Guard allows DONE

GATE 13
Retry loop works

GATE 14
Council escalation works

GATE 15
Sprint executes multiple tasks

GATE 16
Model Router selects models dynamically

GATE 17
Autonomous Development Loop works
```

---

# 80. FIRST SUCCESS CRITERION

Prima demonstrație nu trebuie să fie:

```text
"AI-ul poate conversa."
```

și nici:

```text
"30B poate scrie cod."
```

Prima demonstrație trebuie să fie:

```text
LifeOS primește un Task real
        ↓
agenții îl analizează
        ↓
workflow-ul creează Contract + ImpactMap
        ↓
Coder-ul 30B modifică repository-ul
        ↓
Scope Guard validează modificările
        ↓
Tester-ul execută testele independent
        ↓
Triage interpretează rezultatul
        ↓
Reviewer-ul verifică implementarea
        ↓
Workflow Guard permite DONE
```

Acesta este primul proof-of-architecture.

După acest milestone, restul sistemului poate fi extins incremental.

---

# 81. HARDWARE / LOCAL EXECUTION POLICY

Pentru dezvoltarea locală pe PC-ul principal:

```text
ONE ACTIVE MODEL AT A TIME
```

Modelul implicit pentru Coder:

```text
qwen3-coder:30b
```

Celelalte roluri pot utiliza modele mai mici.

Exemplu:

```text
Planner    → qwen3:8b
Analyst    → qwen3:8b
Architect  → qwen3:14b
Coder      → qwen3-coder:30b
Tester     → qwen3:8b
Triage     → qwen3:8b
Reviewer   → qwen3:14b
```

Aceste valori sunt configurație inițială, nu reguli arhitecturale.

Dacă hardware-ul demonstrează că `qwen3-coder:30b` poate executa confortabil și alte roluri, acest lucru poate fi folosit temporar pentru dezvoltare și debugging.

Totuși, arhitectura trebuie să păstreze separarea logică a rolurilor chiar dacă același model este utilizat de mai multe roluri.

---

# 82. LOCAL-FIRST DEVELOPMENT MODE

Înainte de introducerea cloud execution, sistemul trebuie să poată executa întregul Development Task Loop local.

Configurația recomandată pentru primul test:

```text
provider = ollama

Planner
→ small local model

Analyst
→ small local model

Architect
→ small/medium local model

Coder
→ qwen3-coder:30b

Tester
→ small local model

Triage
→ small local model

Reviewer
→ small/medium local model
```

OpenRouter / CloudChatClient rămâne o extensie opțională.

Nu trebuie să fie o dependență pentru primul development flow.

---

# 83. DEFINITION OF ARCHITECTURE COMPLETE

Arhitectura Development Engine este considerată completă numai când poate executa toate următoarele:

```text
[ ] Create task
[ ] Persist task
[ ] Analyze task
[ ] Build context
[ ] Run Planner
[ ] Run Analyst
[ ] Run Architect
[ ] Produce Council decision
[ ] Produce Task Contract
[ ] Produce Impact Map
[ ] Validate workflow
[ ] Run Coder
[ ] Modify repository
[ ] Enforce permissions
[ ] Enforce scope
[ ] Run tests
[ ] Produce TestReport
[ ] Run Triage
[ ] Classify failure
[ ] Retry related failure
[ ] Create unrelated task
[ ] Escalate ambiguous failure
[ ] Enforce maximum attempts
[ ] Run Reviewer
[ ] Validate Definition of Done
[ ] Transition to DONE
[ ] Persist complete execution history
```

După această listă se poate considera că există un Development Engine funcțional.

---

# 84. DEFINITION OF AUTONOMOUS DEVELOPMENT COMPLETE

Sistemul este considerat autonom numai când, pornind de la un Sprint:

```text
Sprint
 ↓
Task selection
 ↓
Task execution
 ↓
Agent orchestration
 ↓
Coding
 ↓
Testing
 ↓
Triage
 ↓
Retry / New Task / Council
 ↓
Review
 ↓
DONE
 ↓
Next Task
 ↓
Sprint Review
```

poate executa întreg ciclul fără intervenția manuală a dezvoltatorului, exceptând situațiile explicit definite ca:

```text
BLOCKED
NEEDS_CLARIFICATION
ARCHITECTURE_REVIEW
AMBIGUOUS
RESOURCE_FAILURE
```

În aceste cazuri sistemul trebuie să se oprească într-o stare deterministă și să păstreze toate informațiile necesare pentru reluare.

---

# 85. DEVELOPMENT RULE

În continuarea implementării:

```text
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
```

Nu implementăm întregul roadmap într-o singură operație.

Fiecare mini-task trebuie să producă:

```text
files changed
tests added/changed
tests executed
result
remaining work
```

Un LLM nu poate declara singur că un milestone este finalizat.

Milestone-ul este finalizat numai după ce testele și Workflow Guard demonstrează condițiile definite.

---

# 86. IMMEDIATE NEXT ACTION

Starea actuală este:

```text
PHASE 4 — IMPACT MAP
COMPLETED

PHASE 5 — GIT
SKIPPED / MANUAL

PHASE 6 — AGENT RUNNER
IN PROGRESS
```

Următorul mini-task obligatoriu este:

```text
AgentRunner Provider Abstraction
```

și apoi:

```text
AgentContext
ContextBuilder
Tool Layer
Permission Engine
Coder Write Path
Test Execution
```

Nu se începe Sprint Engine înainte ca:

```text
FIRST REAL DEVELOPMENT TEST
```

să fie trecut cu succes.

Nu se începe Autonomous Development Loop înainte ca toate failure paths principale să fie testate.

Nu se introduce complexitate suplimentară doar pentru a anticipa fazele viitoare.

Obiectivul imediat este:

```text
EXISTING FOUNDATION
        ↓
REAL AGENTS
        ↓
REAL CODER
        ↓
REAL REPOSITORY CHANGE
        ↓
REAL TEST
        ↓
REAL TRIAGE
        ↓
REAL REVIEW
        ↓
DONE
```

Acesta este milestone-ul care validează dacă arhitectura LifeOS funcționează în practică.
