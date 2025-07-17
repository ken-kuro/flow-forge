# Pre-Phase: Simplified Context-Aware Asset System

## Overview

This pre-phase implements a simplified version of the context-aware asset system with significant constraints to make development faster and more manageable. Instead of complex execution path inheritance, we use a single setup node constraint where the entire flow shares the same asset context.

## Constraints

### Single Setup Node Constraint

- Each flow has exactly **one setup node**
- All assets are configured in this single setup node
- The entire flow shares the same asset context from this setup node

### Asset Configuration Constraints

- **Image Assets**: Either one image with elements config OR multiple normal images
- **LMS Assets**: Exactly one LMS type (practice/conversation/dialogue/game) and one question type per flow (question type only applies to practice)

### Node Asset Loading Rules

Based on question type requirements:

- **Questions requiring screen display** (true_false, single_choice, matching, games, conversation, dialogue): Each node can only have one assets-applied block
- **Questions not requiring screen display** (speaking types only): Each node can have 1 image + 1 LMS in the same assets-applied block

## Simplified Architecture

### Flow-Level Context

Instead of node-by-node context inheritance, we have:

- Single asset context read from the setup node
- Flow-wide availability of this context
- No complex execution path calculations needed

### Core Components

#### 1. Simple Flow Context Store (`src/stores/flow-context-store.js`)

```javascript
const useFlowContextStore = defineStore('flowContext', () => {
    // State
    const currentFlowContext = ref({
        elements: [], // Array of elements (objects/texts) from image with elements config
        lms: null, // Single LMS asset with type and questions
    })

    // Getters for filtering
    const getFilteredMethodsForLMS = computed(() => {
        if (!currentFlowContext.value.lms) return []
        return getCollectUserDataMethods(currentFlowContext.value.lms.type, currentFlowContext.value.lms.questionType)
    })

    const getFilteredActionsForAssets = computed(() => {
        if (!currentFlowContext.value.lms) return []
        return getSystemActionMethods(
            currentFlowContext.value.lms.type,
            currentFlowContext.value.lms.questionType,
            currentFlowContext.value.elements,
        )
    })

    const getFilteredTargetsForAction = (actionType) => {
        return getSystemActionTargets(actionType, currentFlowContext.value.elements)
    }

    const getFilteredConditionsForLMS = computed(() => {
        if (!currentFlowContext.value.lms) return []
        return getConditionExpressions(
            currentFlowContext.value.lms.type,
            currentFlowContext.value.lms.questionType,
            currentFlowContext.value.elements,
        )
    })
})
```

#### 2. Simple Asset Context Composable (`src/composables/use-simple-asset-context.js`)

```javascript
export function useSimpleAssetContext() {
    const flowContextStore = useFlowContextStore()

    // Simple getters for current flow context
    const flowContext = computed(() => flowContextStore.currentFlowContext)
    const hasElements = computed(() => flowContext.value.elements.length > 0)
    const hasLMSAssets = computed(() => !!flowContext.value.lms)
    const lmsType = computed(() => flowContext.value.lms?.type)
    const questionType = computed(() => flowContext.value.lms?.questionType)

    // Element filtering helpers
    const getObjectElements = computed(() => flowContext.value.elements.filter((el) => el.type === 'object'))
    const getTextElements = computed(() => flowContext.value.elements.filter((el) => el.type === 'text'))

    // Filtering functions based on LMS type, question type, and elements
    const getFilteredMethods = () => flowContextStore.getFilteredMethodsForLMS
    const getFilteredActions = () => flowContextStore.getFilteredActionsForAssets
    const getFilteredTargets = (actionType) => flowContextStore.getFilteredTargetsForAction(actionType)
    const getFilteredConditions = () => flowContextStore.getFilteredConditionsForLMS

    return {
        flowContext,
        hasElements,
        hasLMSAssets,
        lmsType,
        questionType,
        getObjectElements,
        getTextElements,
        getFilteredMethods,
        getFilteredActions,
        getFilteredTargets,
        getFilteredConditions,
    }
}
```

## Implementation Tasks

### Phase 1: Setup Context Reading

- [ ] Create `useFlowContextStore` with simple asset storage
- [ ] Add setup node asset reading on flow load
- [ ] Implement asset context updates when setup node changes

### Phase 2: Block Filtering Integration

- [ ] Enhance `collect-user-data-block` with LMS-based method filtering
- [ ] Update `system-action-block` with asset-based action/target filtering
- [ ] Modify `condition-branch-block` with LMS-based condition expressions

### Phase 3: Asset Management

- [ ] Add asset deletion warnings showing affected blocks
- [ ] Implement asset reference cleanup
- [ ] Add visual indicators for context-filtered options

## Filtering Logic

Based on the condition.csv mapping:

### Collect User Data Methods

```javascript
// Based on question type from LMS context
const getCollectUserDataMethods = (lmsType, questionType) => {
    // Define method objects with rich metadata
    const methods = {
        voice: {
            id: 'voice',
            label: 'Voice',
            description: 'Collect student voice input for speaking assessment',
        },
        chooseAnswer: {
            id: 'choose_answer',
            label: 'Choose Answer',
            description: 'Allow student to select from multiple options',
        },
    }

    // Return appropriate methods based on question type
    if (lmsType === 'practice') {
        switch (questionType) {
            case 'speaking_unscripted':
            case 'speaking_scripted':
                return [methods.voice]

            case 'true_false':
            case 'single_choice':
            case 'matching':
                return [methods.chooseAnswer]

            default:
                return [] // No methods available for unknown question types
        }
    }

    if (lmsType === 'conversation' || lmsType === 'dialogue') {
        return [methods.voice]
    }

    if (lmsType === 'game') {
        return [methods.chooseAnswer]
    }

    return [] // No methods available for unknown types
}
```

### System Action Methods

```javascript
// Based on LMS type, question type, and available elements
const getSystemActionMethods = (lmsType, questionType, elements) => {
    const methods = []

    // Helper to check if we have object elements
    const hasObjectElements = elements.some((el) => el.type === 'object')
    const hasTextElements = elements.some((el) => el.type === 'text')

    // Filter actions based on LMS type and question type
    if (lmsType === 'practice') {
        switch (questionType) {
            case 'speaking_unscripted':
                // For speaking_unscripted with objects, offer highlight_elements
                if (hasObjectElements) {
                    methods.push({
                        id: 'highlight_elements',
                        label: 'Highlight Elements',
                        description: 'Highlight objects mentioned in student answer',
                        targetType: 'object',
                    })
                }
                break

            case 'speaking_scripted':
                // For speaking_scripted, always offer show_pronunciation_result
                if (hasTextElements) {
                    methods.push({
                        id: 'show_pronunciation_result',
                        label: 'Show Pronunciation Result',
                        description: 'Display pronunciation feedback to student',
                        targetType: 'text',
                    })
                }

                // If there are also objects, offer highlight_elements
                if (hasObjectElements) {
                    methods.push({
                        id: 'highlight_elements',
                        label: 'Highlight Elements',
                        description: 'Highlight objects in the image',
                        targetType: 'object',
                    })
                }
                break

            case 'conversation':
            case 'dialogue':
            case 'true_false':
            case 'single_choice':
            case 'matching':
                // For these question types, no special actions available
                break
        }
    }

    // For other LMS types (conversation, dialogue, game), no special actions available
    if (lmsType === 'conversation' || lmsType === 'dialogue' || lmsType === 'game') {
        // No system actions for these types
    }

    return methods
}

// Target filtering for system actions
const getSystemActionTargets = (actionType, elements) => {
    const targets = []

    switch (actionType) {
        case 'highlight_elements':
            // Return object elements for highlighting
            targets.push(
                ...elements
                    .filter((el) => el.type === 'object')
                    .map((element) => ({
                        id: element.id,
                        name: element.name || element.id,
                        type: element.type,
                        isMainObject: element.isMainObject || false,
                        isRelatedObject: element.isRelatedObject || false,
                    })),
            )
            break

        case 'show_pronunciation_result':
            // For pronunciation result, return static "user_answer" target
            // The correct text to show pronunciation result on will be chosen based on user answer
            targets.push({
                id: 'user_answer',
                name: 'User Answer',
                type: 'user_answer',
                description: 'Show pronunciation result based on user answer content',
            })

            // TODO: Text element selection logic commented out for now
            // The system will determine which text elements to highlight based on user answer analysis
            // ...elements
            //     .filter((el) => el.type === 'text')
            //     .map((element) => ({
            //         id: element.id,
            //         name: element.name || element.id,
            //         type: element.type,
            //         content: element.content || '',
            //     }))
            break
    }

    return targets
}
```

### Condition Branch Expressions

```javascript
// Based on LMS type, question type, and available elements
const getConditionExpressions = (lmsType, questionType, elements) => {
    const expressions = []

    // Helper to check if we have object elements
    const hasObjectElements = elements.some((el) => el.type === 'object')

    if (lmsType === 'practice') {
        switch (questionType) {
            case 'speaking_unscripted':
                // Check if this is a "What can you see?" type question with objects
                if (hasObjectElements) {
                    // Complex object-based conditions for speaking_unscripted with objects
                    expressions.push(
                        {
                            id: 'object_relevant_high',
                            label: 'Trả lời liên quan >= 50% object chính',
                            description: 'Học viên trả lời liên quan và đề cập đến ít nhất 50% các object chính',
                            expression:
                                'user_answer.main_length > 0 && objects.main_length > 0 && user_answer.main_length >= 0.5*objects.main_length',
                        },
                        {
                            id: 'object_relevant_low',
                            label: 'Trả lời liên quan < 50% (object chính + object liên quan)',
                            description: 'Học viên trả lời liên quan nhưng đề cập đến ít hơn 50% các object',
                            expression:
                                'user_answer.length > 0 && objects.length > 0 && user_answer.length < 0.5*objects.length',
                        },
                        {
                            id: 'object_related_only',
                            label: 'Trả lời không chứa object chính, nhưng có object liên quan',
                            description: 'Học viên không đề cập object chính nhưng có đề cập object liên quan',
                            expression: 'user_answer.main_length <= 0 && user_answer.relevant_length >= 1',
                        },
                        {
                            id: 'object_none',
                            label: 'Ngoài 3 trường hợp trên',
                            description: 'Học viên không đề cập đến bất kỳ object nào hoặc trả lời không liên quan',
                            expression: 'OTHER',
                        },
                        {
                            id: 'second_attempt_divider',
                            label: '--- Lượt 2 (hỏi lại khi rơi vào 2,3,4) ---',
                            isHeader: true,
                        },
                        {
                            id: 'second_attempt_relevant',
                            label: 'Trả lời liên quan đến object chính/ object liên quan',
                            description: 'Học viên trả lời có đề cập đến object chính hoặc liên quan',
                            expression: 'user_answer.main_length > 0 ||  user_answer.relevant_length > 0',
                        },
                        {
                            id: 'second_attempt_irrelevant',
                            label: 'Ngoài 1 trường hợp trên',
                            description: 'Học viên không đề cập đến bất kỳ object nào hoặc trả lời không liên quan',
                            expression: 'OTHER',
                        },
                    )
                } else {
                    // Simple AI-based conditions for general speaking_unscripted questions
                    expressions.push(
                        {
                            id: 'ai_relevant',
                            label: 'Trả lời liên quan',
                            description: 'AI xác định học viên trả lời liên quan đến câu hỏi',
                            expression: 'user_answer.content_evaluation == accordant',
                        },
                        {
                            id: 'ai_lack_knowledge',
                            label: 'Trả lời không biết',
                            description: 'Học viên trả lời không biết',
                            expression: 'user_answer.content_evaluation == lack_of_knowledge',
                        },
                        {
                            id: 'ai_irrelevant',
                            label: 'Các trường hợp còn lại',
                            description: 'Trả lời không liên quan, tiêu cực, hỏi lại giáo viên',
                            expression: 'OTHER',
                        },
                        {
                            id: 'ai_silent',
                            label: 'Im lặng',
                            description: 'Học viên im lặng',
                            expression: 'NO_ANSWER',
                        },
                    )
                }
                break

            case 'speaking_scripted':
                expressions.push(
                    {
                        id: 'pronunciation_good',
                        label: 'Phát âm đúng (>60%)',
                        description: 'Học viên phát âm đúng trên 60%',
                        expression: 'user_answer.pronunciation >= 60',
                    },
                    {
                        id: 'pronunciation_poor',
                        label: 'Phát âm chưa đúng (< 60%)',
                        description: 'Học viên phát âm đúng dưới 60%',
                        expression: 'user_answer.pronunciation < 60',
                    },
                )
                break

            case 'true_false':
            case 'single_choice':
                expressions.push(
                    {
                        id: 'answer_correct',
                        label: 'Chọn đúng',
                        description: 'Học viên chọn đáp án đúng',
                        expression: 'user_answer == true',
                    },
                    {
                        id: 'answer_incorrect',
                        label: 'Chọn sai',
                        description: 'Học viên chọn đáp án sai',
                        expression: 'user_answer == false',
                    },
                    {
                        id: 'answer_none',
                        label: 'Im lặng',
                        description: 'Học viên không chọn đáp án',
                        expression: 'NO_ANSWER',
                    },
                )
                break

            case 'matching':
                expressions.push(
                    {
                        id: 'matching_perfect',
                        label: 'Đúng hết (100%)',
                        description: 'Học viên ghép đúng tất cả các cặp',
                        expression: 'user_answer >= 100',
                    },
                    {
                        id: 'matching_imperfect',
                        label: 'Không đúng hết (các trường hợp còn lại)',
                        description: 'Học viên ghép sai ít nhất một cặp',
                        expression: 'user_answer < 100',
                    },
                )
                break
        }
    }

    if (lmsType === 'conversation') {
        expressions.push(
            {
                id: 'conversation_good',
                label: 'Nói đúng (>=60%)',
                description: 'Điểm trung bình ngữ pháp & từ vựng >= 60%',
                expression: 'user_answer.avg_cumulative_score >= 60',
            },
            {
                id: 'conversation_poor',
                label: 'Nói đúng (< 60%)',
                description: 'Điểm trung bình ngữ pháp & từ vựng < 60%',
                expression: 'user_answer.avg_cumulative_score < 60',
            },
        )
    }

    if (lmsType === 'dialogue') {
        expressions.push(
            {
                id: 'dialogue_good',
                label: 'Nói đúng (>=60%)',
                description: 'Phát âm đúng trên 60%',
                expression: 'user_answer.avg_cumulative_score >= 60',
            },
            {
                id: 'dialogue_poor',
                label: 'Nói chưa đúng (< 60%)',
                description: 'Phát âm đúng dưới 60%',
                expression: 'user_answer.avg_cumulative_score < 60',
            },
        )
    }

    if (lmsType === 'game') {
        expressions.push(
            {
                id: 'game_good',
                label: 'Đúng bằng hoặc trên 70%',
                description: 'Học viên đạt điểm từ 70% trở lên',
                expression: 'user_answer >= 70',
            },
            {
                id: 'game_poor',
                label: 'Đúng dưới 70%',
                description: 'Học viên đạt điểm dưới 70%',
                expression: 'user_answer < 70',
            },
        )
    }

    return expressions
}
```

## Benefits of This Approach

1. **Immediate Value**: Users get smart filtering without waiting for complex inheritance
2. **Faster Development**: No execution path calculations or context merging
3. **Easier Testing**: Single context source makes testing straightforward
4. **Reusable Logic**: Filtering functions will work in the full system later
5. **User Validation**: Can validate the filtering concept before building complexity

## Migration to Full System

When ready for the full context-aware system:

1. **Keep Filtering Logic**: The filtering functions built here are reusable
2. **Extend Context Store**: Add node-level context on top of flow-level
3. **Add Inheritance**: Implement execution path context inheritance
4. **Maintain Compatibility**: Single setup flows continue to work as before

## Limitations

- Only works with single setup node flows
- No asset overrides or context changes mid-flow
- No conditional asset availability based on execution path
- Limited to one LMS type per flow

These limitations are acceptable for the pre-phase and will be addressed in the full implementation.
