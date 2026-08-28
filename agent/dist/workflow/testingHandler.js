import { validateTestResult, } from "./testing.js";
import { classifyTestResultScope, } from "./scopeClassifier.js";
import { createChildTask, } from "./taskFactory.js";
export function handleTestResult(task, result, guard, store) {
    validateTestResult(task, result);
    if (task.status !== "TESTING") {
        throw new Error(`Testing result can only be handled for a task in TESTING status. Current status: ${task.status}.`);
    }
    /*
    
    * TESTING
    * ↓
    * TRIAGE
      */
    const triageTask = guard.transition(task.id, "TRIAGE", result.type === "PASS"
        ? "Testing passed; task moved to TRIAGE."
        : "Testing result received; task moved to TRIAGE.");
    /*
    
    * PASS
    *
    * TESTING
    * ↓
    * TRIAGE
    * ↓
    * REVIEW
    * ↓
    * DONE
      */
    if (result.type === "PASS") {
        const reviewTask = guard.transition(triageTask.id, "REVIEW", "Triage passed; task moved to REVIEW.");
        const completedTask = guard.transition(reviewTask.id, "DONE", "Review approved; task completed.");
        return {
            task: completedTask,
            resultType: "PASS",
            scope: null,
            newTask: null,
        };
    }
    const scope = classifyTestResultScope(task, result);
    /*
    
    * IN-SCOPE FAILURE
    *
    * TESTING
    * ↓
    * TRIAGE
    * ↓
    * FIX_REQUIRED
      */
    if (scope.classification ===
        "IN_SCOPE") {
        const fixRequiredTask = guard.transition(triageTask.id, "FIX_REQUIRED", "Testing failed due to an in-scope issue.");
        return {
            task: fixRequiredTask,
            resultType: "REWORK",
            scope,
            newTask: null,
        };
    }
    /*
    
    * OUT-OF-SCOPE FAILURE
    *
    * TESTING
    * ↓
    * TRIAGE
    * ↓
    * REVIEW
    * ↓
    * DONE
    *
    * * create child task
        */
    const reviewTask = guard.transition(triageTask.id, "REVIEW", "Testing failed due to an out-of-scope issue; original task moved to REVIEW.");
    const completedTask = guard.transition(reviewTask.id, "DONE", "Review approved; original task completed.");
    const sequence = store.getNextChildSequence(task.id);
    const newTask = createChildTask(completedTask, {
        title: result.summary,
        description: result.details,
        scope: {
            files: result.files ?? [],
            components: result.components ?? [],
            behavior: result.expectedBehavior
                ? [
                    result.expectedBehavior,
                ]
                : [],
            exclusions: [],
        },
    }, sequence);
    store.add(newTask);
    return {
        task: completedTask,
        resultType: "NEW_TASK",
        scope,
        newTask,
    };
}
