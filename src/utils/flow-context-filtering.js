/**
 * @fileoverview This file contains the logic for filtering options based on the context of the flow.
 */

// TODO: Add i18n for the labels and descriptions
import { LMS_TYPES, QUESTION_TYPES } from '@/components/nodes/setup/blocks/lms.js'

// #region: Collect User Data Block

// TODO: Maybe we should define the methods in a separate file and import them here?
// Define method objects with rich metadata
/**
 * @typedef {Object} CollectUserDataMethod
 * @property {string} value - The unique identifier for the method
 * @property {string} label - The human-readable label for the method
 * @property {string} description - A brief description of the method's purpose
 */
const COLLECT_USER_DATA_METHODS = {
    voice: {
        value: 'voice',
        label: 'Voice',
        description: 'Collect student voice input for speaking assessment',
    },
    chooseAnswer: {
        value: 'choose-answer',
        label: 'Choose Answer',
        description: 'Allow student to select from multiple options',
    },
    text: {
        value: 'text-input',
        label: 'Text Input',
        description: 'Collect student text input for text-based assessment',
    },
}

const COLLECT_USER_DATA_METHOD_MAP = {
    [QUESTION_TYPES.SPEAKING_UNSCRIPTED]: [COLLECT_USER_DATA_METHODS.voice],
    [QUESTION_TYPES.SPEAKING_SCRIPTED]: [COLLECT_USER_DATA_METHODS.voice],
    [QUESTION_TYPES.TRUE_FALSE]: [COLLECT_USER_DATA_METHODS.chooseAnswer],
    [QUESTION_TYPES.SINGLE_CHOICE]: [COLLECT_USER_DATA_METHODS.chooseAnswer],
    // QUESTION_TYPES.MATCHING and others will default to []
}

/**
 * Get the collect user data methods for a given LMS type and question type
 * @param {LMS_TYPES} lmsType - The type of LMS
 * @param {QUESTION_TYPES} questionType - The type of question
 * @returns {Array<CollectUserDataMethod>} - An array of method objects
 */
const getCollectUserDataMethods = (lmsType, questionType) => {
    if (lmsType !== LMS_TYPES.PRACTICE) {
        return []
    }

    // Return a copy so callers can't mutate the original object
    const methods = COLLECT_USER_DATA_METHOD_MAP[questionType]
    return methods ? methods.slice() : []
}

// #endregion: Collect User Data Block

// #region: System Actions Block

const SYSTEM_ACTION_METHODS = {
    highlightElements: {
        value: 'highlight-elements',
        label: 'Highlight Elements',
        description: 'Highlight elements in the scene',
    },
    showPronunciationResult: {
        value: 'show-pronunciation-result',
        label: 'Show Pronunciation Result',
        description: 'Show the pronunciation feedback to the student',
    },
}

const SYSTEM_ACTION_GENERATORS = {
    [QUESTION_TYPES.SPEAKING_UNSCRIPTED]: ({ hasObject }) =>
        hasObject ? [SYSTEM_ACTION_METHODS.highlightElements] : [],
    [QUESTION_TYPES.SPEAKING_SCRIPTED]: ({ hasObject, hasText }) => [
        ...(hasText ? [SYSTEM_ACTION_METHODS.showPronunciationResult] : []),
        ...(hasObject ? [SYSTEM_ACTION_METHODS.highlightElements] : []),
    ],
}

/**
 * Get the system action methods for a given LMS type and question type and elements in the scene
 * @param {LMS_TYPES} lmsType - The type of LMS (can be null for manual highlighting)
 * @param {QUESTION_TYPES} questionType - The type of question (can be null for manual highlighting)
 * @param {Array<Object>} objects - The objects in the scene
 * @param {Array<Object>} texts - The texts in the scene
 * @returns {Array<SystemActionMethod>} - An array of method objects
 */
const getSystemActionMethods = (lmsType, questionType, objects, texts) => {
    const context = {
        hasObject: objects.length > 0,
        hasText: texts.length > 0,
    }

    // Case 1: Manual highlighting - when there are objects but no LMS configuration
    if (!lmsType && context.hasObject) {
        return [SYSTEM_ACTION_METHODS.highlightElements]
    }

    // Case 2: LMS-based system actions (original logic)
    if (lmsType === LMS_TYPES.PRACTICE) {
        const generator = SYSTEM_ACTION_GENERATORS[questionType]
        return generator ? generator(context) : []
    }

    // Case 3: No LMS and no objects, or other LMS types
    return []
}

/**
 * Get the targets for a given system action type
 * @param {string} actionType - The value of system action
 * @param {Array<Object>} objects - The objects in the scene
 * @param {boolean} hasLmsContext - Whether there's an LMS context (affects user_answer availability)
 * @returns {Array<Object>} - An array of target objects with display names and values
 */
const getSystemActionTargets = (actionType, objects, hasLmsContext = true) => {
    const targets = []

    switch (actionType) {
        case SYSTEM_ACTION_METHODS.highlightElements.value:
            // Only add user answer target if there's LMS context
            if (hasLmsContext) {
                targets.push({
                    id: 'user_answer.ids',
                    name: 'User Answer Elements',
                    description: 'Elements mentioned in user answer',
                })
            }

            // Always add object targets for on-demand highlighting
            objects.forEach((object) => {
                const isMain = object.isMain === true
                const status = isMain ? 'Main' : 'Relevant'
                targets.push({
                    id: object.id,
                    name: object.name || `Object ${object.id}`,
                    description: `${status} Object: ${object.name || object.id}`,
                    isMain: isMain,
                    category: isMain ? 'main' : 'relevant',
                })
            })
            break

        case SYSTEM_ACTION_METHODS.showPronunciationResult.value:
            // For pronunciation result, return only "user_answer" target
            // This user_answer.ids will be resolved by the client in runtime, based on the text and user transcript to resolve the real text id
            targets.push({
                id: 'user_answer.ids',
                name: 'User Pronunciation Result',
                description: 'Text elements from pronunciation analysis',
            })
            break
    }

    return targets
}

// #endregion: System Actions Block

// #region: Condition Branch Block

const DEFAULT_OTHER_BRANCH = {
    value: 'OTHER',
    label: 'Khác',
    description: 'Nằm ngoài các trường hợp trên',
    cup: 0,
}

const DEFAULT_NO_ANSWER_BRANCH = {
    value: 'NO_ANSWER',
    label: 'Không trả lời',
    description: 'Học sinh không trả lời',
    cup: 0,
}

const UNSCRIPTED_WITHOUT_OBJECT_BRANCHES = [
    {
        value: 'user_answer.content_evaluation == "accordant"',
        label: 'Trả lời liên quan',
        description: 'Học sinh trả lời liên quan',
        cup: 0,
    },
    {
        value: 'user_answer.content_evaluation == "lack_of_knowledge"',
        label: 'Trả lời không biết',
        description: 'Học sinh trả lời không biết',
        cup: 0,
    },
    DEFAULT_OTHER_BRANCH,
    DEFAULT_NO_ANSWER_BRANCH,
]
const UNSCRIPTED_WITH_OBJECT_BRANCHES = [
    {
        value: 'user_answer.main_length > 0 && objects.main_length > 0 && user_answer.main_length >= 0.5*objects.main_length',
        label: 'Trả lời có chứa object chính và >= 50% object chính',
        description: 'Học sinh trả lời có chứa object chính và đề cập ít nhất 50% object chính',
        cup: 0,
    },
    {
        value: 'user_answer.main_length > 0 && objects.main_length > 0 && user_answer.main_length < 0.5*objects.main_length',
        label: 'Trả lời có chứa object chính và < 50% object chính',
        description: 'Học sinh trả lời có chứa object chính và đề cập ít hơn 50% object chính',
        cup: 0,
    },
    {
        value: 'user_answer.main_length <= 0 && user_answer.relevant_length >= 1',
        label: 'Trả lời không chứa object chính, nhưng có object liên quan',
        description: 'Học sinh trả lời không chứa object chính, nhưng có object liên quan',
        cup: 0,
    },
    DEFAULT_OTHER_BRANCH,
    DEFAULT_NO_ANSWER_BRANCH,
    {
        value: 'user_answer.main_length > 0 ||  user_answer.relevant_length > 0',
        label: '[Hỏi lại] Trả lời có chứa object chính hoặc object liên quan',
        description: '[Hỏi lại] Học sinh trả lời có chứa object chính hoặc object liên quan',
        cup: 0,
    },
]

const SCRIPTED_BRANCHES = [
    {
        value: 'user_answer.pronunciation >= 60',
        label: 'Đúng phát âm',
        description: 'Học sinh đúng phát âm',
        cup: 1,
    },
    {
        value: 'user_answer.pronunciation < 60',
        label: 'Sai phát âm',
        description: 'Học sinh sai phát âm',
        cup: 0,
    },
]

const TRUE_FALSE_BRANCHES = [
    {
        value: 'user_answer == true',
        label: 'Trả lời đúng',
        description: 'Học sinh trả lời đúng',
        cup: 1,
    },
    {
        value: 'user_answer == false',
        label: 'Trả lời sai',
        description: 'Học sinh trả lời sai',
        cup: 0,
    },
    DEFAULT_NO_ANSWER_BRANCH,
]

const SINGLE_CHOICE_BRANCHES = TRUE_FALSE_BRANCHES

const MATCHING_BRANCHES = [
    {
        value: 'user_answer >= 100',
        label: 'Đúng hết',
        description: 'Học sinh trả lời đúng tất cả các câu hỏi',
        cup: 2,
    },
    {
        value: 'user_answer < 100',
        label: 'Không đúng hết',
        description: 'Học sinh trả lời không đúng tất cả các câu hỏi',
        cup: 0,
    },
]

const CONVERSATION_BRANCHES = [
    {
        value: 'user_answer.avg_cumulative_score >= 60',
        label: 'Đúng bằng hoặc hơn 60%',
        description: 'Học sinh trả lời đúng bằng hoặc hơn 60%',
        cup: 0,
    },
    {
        value: 'user_answer.avg_cumulative_score < 60',
        label: 'Ít hơn 60%',
        description: 'Học sinh trả lời ít hơn 60%',
        cup: 0,
    },
]

const DIALOGUE_BRANCHES = [
    {
        value: 'user_answer.avg_cumulative_score >= 60',
        label: 'Đúng bằng hoặc hơn 60%',
        description: 'Học sinh trả lời đúng bằng hoặc hơn 60%',
        cup: 2,
    },
    {
        value: 'user_answer.avg_cumulative_score < 60',
        label: 'Ít hơn 60%',
        description: 'Học sinh trả lời ít hơn 60%',
        cup: 0,
    },
]

const GAME_WHACK_A_MOLE_BRANCHES = [
    {
        value: 'user_answer >= 70',
        label: 'Đúng bằng hoặc hơn 70%  ',
        description: 'Học sinh trả lời đúng bằng hoặc hơn 70%',
        cup: 0,
    },
    {
        value: 'user_answer < 70',
        label: 'Ít hơn 70%',
        description: 'Học sinh trả lời ít hơn 70%',
        cup: 0,
    },
]
const GAME_PRONUNCIATION_BRANCHES = [
    {
        value: 'user_answer.avg_cumulative_score >= 60',
        label: 'Đúng bằng hoặc hơn 60%',
        description: 'Học sinh trả lời đúng bằng hoặc hơn 60%',
        cup: 0,
    },
    {
        value: 'user_answer.avg_cumulative_score < 60',
        label: 'Ít hơn 60%',
        description: 'Học sinh trả lời ít hơn 60%',
        cup: 0,
    },
]

const PRACTICE_BRANCH_GENERATORS = {
    [QUESTION_TYPES.SPEAKING_UNSCRIPTED]: (objects) =>
        objects.length > 0 ? UNSCRIPTED_WITH_OBJECT_BRANCHES : UNSCRIPTED_WITHOUT_OBJECT_BRANCHES,
    [QUESTION_TYPES.SPEAKING_SCRIPTED]: () => SCRIPTED_BRANCHES,
    [QUESTION_TYPES.TRUE_FALSE]: () => TRUE_FALSE_BRANCHES,
    [QUESTION_TYPES.SINGLE_CHOICE]: () => SINGLE_CHOICE_BRANCHES,
    [QUESTION_TYPES.MATCHING]: () => MATCHING_BRANCHES,
}

/**
 * Get the condition branch for a given LMS type and question type and objects in the scene
 * @param {LMS_TYPES} lmsType - The type of LMS
 * @param {QUESTION_TYPES} questionType - The type of question
 * @param {Array<Object>} objects - The objects in the scene
 * @returns {Array<Object>} - An array of condition objects
 */
const getConditionBranch = (lmsType, questionType, objects) => {
    switch (lmsType) {
        case LMS_TYPES.PRACTICE: {
            const gen = PRACTICE_BRANCH_GENERATORS[questionType]
            return gen ? gen(objects).slice() : []
        }
        case LMS_TYPES.CONVERSATION:
            return CONVERSATION_BRANCHES.slice()
        case LMS_TYPES.DIALOGUE:
            return DIALOGUE_BRANCHES.slice()
        case LMS_TYPES.GAME_WHACK_A_MOLE:
            return GAME_WHACK_A_MOLE_BRANCHES.slice()
        case LMS_TYPES.GAME_PRONUNCIATION:
            return GAME_PRONUNCIATION_BRANCHES.slice()
        default:
            return []
    }
}

// #endregion: Condition Branch Block

export { getCollectUserDataMethods, getSystemActionMethods, getSystemActionTargets, getConditionBranch }
